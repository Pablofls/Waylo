"""Persistencia del historial de posiciones (tabla `ride_points`)."""
import logging
import time

log = logging.getLogger("waylo.store")

MAX_BUFFER = 5000


class PositionStore:
    """Interfaz: guarda una lista de puntos (dicts con user_id, ride_id, latitude, ...)."""

    def save_points(self, points):
        raise NotImplementedError


class NullStore(PositionStore):
    """No guarda nada. Se usa mientras el esquema de la sesión A no esté en `main`."""

    def save_points(self, points):
        pass


def build_store(database_url):
    # PENDIENTE (depende de la sesión A): implementar PostgresPositionStore con psycopg 3
    # contra el esquema real de `ride_points` cuando exista en db/migrations.
    if database_url:
        log.warning("Persistencia a Postgres pendiente: el historial no se está guardando.")
    return NullStore()


class BatchWriter:
    """Acumula puntos y los escribe cada `interval` s o al llegar a `max_size`."""

    def __init__(self, store, max_size=50, interval=5.0, clock=time.monotonic):
        self.store, self.max_size, self.interval, self.clock = store, max_size, interval, clock
        self._buf = []
        self._last_flush = clock()

    def add(self, point):
        self._buf.append(point)
        if len(self._buf) >= self.max_size:
            self.flush()

    def flush_if_due(self):
        if self._buf and self.clock() - self._last_flush >= self.interval:
            self.flush()

    def flush(self):
        self._last_flush = self.clock()
        if not self._buf:
            return
        batch, self._buf = self._buf, []
        try:
            self.store.save_points(batch)
        except Exception as exc:  # no perder puntos por un fallo temporal
            log.error("Error al guardar lote de %d puntos: %s", len(batch), type(exc).__name__)
            self._buf = (batch + self._buf)[-MAX_BUFFER:]
