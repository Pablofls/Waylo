"""Persistencia del historial de posiciones (tabla `ride_points`) con escritura asíncrona."""
import logging
import queue
import threading
import time

import psycopg

log = logging.getLogger("waylo.store")

MAX_BUFFER = 5000
RETRIES = 3

SQL_INSERT = (
    "INSERT INTO ride_points (ride_id, ts, geog, speed, heading, accuracy) "
    "VALUES (%(ride_id)s, %(ts)s, ST_SetSRID(ST_MakePoint(%(longitude)s, %(latitude)s), 4326)::geography, "
    "%(speed)s, %(heading)s, %(accuracy)s) ON CONFLICT (ride_id, ts) DO NOTHING"
)


class PositionStore:
    """Interfaz: guarda una lista de puntos (dicts con user_id, ride_id, latitude, ...)."""

    kind = "null"

    def save_points(self, points):
        raise NotImplementedError


class NullStore(PositionStore):
    def save_points(self, points):
        pass


class PostgresPositionStore(PositionStore):
    kind = "postgres"

    def __init__(self, database_url, connect_timeout=5, retry_wait=1.0, sleep=time.sleep):
        self.database_url, self.connect_timeout = database_url, connect_timeout
        self.retry_wait, self.sleep = retry_wait, sleep

    def save_points(self, points):
        for attempt in range(RETRIES):
            try:
                return self._write(points)
            except psycopg.OperationalError:
                if attempt == RETRIES - 1:
                    raise
                self.sleep(self.retry_wait * (attempt + 1))

    def _write(self, points):
        # Una conexión por lote. `user_id` no se guarda: el dueño sale de rodada.usuario_id.
        with psycopg.connect(self.database_url, connect_timeout=self.connect_timeout) as conn:
            try:
                with conn.transaction():
                    conn.cursor().executemany(SQL_INSERT, points)
            except psycopg.errors.IntegrityError:
                # Una rodada borrada entre medias no debe tirar todo el lote: fila por fila.
                skipped = 0
                for p in points:
                    try:
                        with conn.transaction():
                            conn.execute(SQL_INSERT, p)
                    except psycopg.errors.IntegrityError:
                        skipped += 1
                log.warning("Puntos descartados por integridad: %d", skipped)


def build_store(database_url):
    if database_url:
        return PostgresPositionStore(database_url)
    log.warning("Sin DATABASE_URL: el historial no se guarda.")
    return NullStore()


class BatchWriter:
    """Cola + hilo escritor. `add` solo encola (no bloquea). Lote cada `interval` s o `max_size` puntos."""

    def __init__(self, store, max_size=50, interval=5.0, start_thread=True):
        self.store, self.max_size, self.interval = store, max_size, interval
        self._q = queue.Queue()
        self._retry = []  # lote que falló, se reintenta antes que lo nuevo
        self.last_error = None
        self.dropped = 0
        self._closed = threading.Event()
        self._thread = None
        if start_thread:
            self._thread = threading.Thread(target=self._run, daemon=True, name="writer")
            self._thread.start()

    @property
    def pending(self):
        return self._q.qsize() + len(self._retry)

    def add(self, point):
        if self.pending >= MAX_BUFFER:
            self.dropped += 1
            return
        self._q.put(point)

    def _run(self):
        while not self._closed.is_set():
            batch = self._collect(self.interval)
            if batch and not self._write(batch):
                self._closed.wait(1.0)  # espera antes de reintentar
        self.flush()

    def _collect(self, wait):
        """Junta hasta max_size puntos; espera como máximo `wait` s por el primero y, una vez
        que llega, otros `wait` s por el resto (el lote sale a los 5 s del primer punto)."""
        batch, self._retry = self._retry, []
        deadline = time.monotonic() + wait
        while len(batch) < self.max_size:
            try:
                remaining = deadline - time.monotonic()
                item = self._q.get(timeout=remaining) if remaining > 0 else self._q.get_nowait()
            except queue.Empty:
                break
            if item is None:  # señal de cierre
                break
            if not batch:
                deadline = time.monotonic() + wait
            batch.append(item)
        return batch

    def _write(self, batch):
        try:
            self.store.save_points(batch)
            self.last_error = None
            return True
        except Exception as exc:  # no perder puntos por un fallo temporal
            self.last_error = type(exc).__name__
            log.error("Error al guardar lote de %d puntos: %s", len(batch), self.last_error)
            self._retry = batch[-MAX_BUFFER:]
            return False

    def flush(self):
        """Escribe todo lo pendiente, ahora (cierre del proceso y pruebas)."""
        while True:
            batch = self._collect(0)
            if not batch:
                return
            self._write(batch)
            if self._retry:
                return  # el almacén sigue fallando; no se queda en bucle

    def close(self):
        self._closed.set()
        self._q.put(None)
        if self._thread:
            self._thread.join(timeout=10)
        else:
            self.flush()
