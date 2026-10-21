"""Validación de la rodada de cada `position`: existe, es del usuario del token y está en curso."""
import logging
import threading
import time
import uuid

import psycopg

log = logging.getLogger("waylo.rides")

POSITIVE_TTL_S = 10
NEGATIVE_TTL_S = 3

SQL_RIDE_ACTIVE = (
    "SELECT 1 FROM rodada WHERE id = %s AND usuario_id = %s "
    "AND finalizada_en IS NULL AND eliminada_en IS NULL"
)


class RideUnverifiable(Exception):
    """No se pudo consultar la base: el mensaje se rechaza (falla cerrado)."""


class RideRegistry:
    def is_active(self, user_id, ride_id):
        """True si la rodada es del usuario y está en curso. Lanza RideUnverifiable si no se sabe."""
        raise NotImplementedError


class PermissiveRegistry(RideRegistry):
    """Sin DATABASE_URL (desarrollo): acepta cualquier ride_id."""

    def is_active(self, user_id, ride_id):
        return True


class PostgresRideRegistry(RideRegistry):
    def __init__(self, database_url, connect_timeout=3):
        self.database_url, self.connect_timeout = database_url, connect_timeout
        self._conn = None
        self._lock = threading.Lock()

    def is_active(self, user_id, ride_id):
        try:
            rid, uid = uuid.UUID(str(ride_id)), uuid.UUID(str(user_id))
        except ValueError:
            return False  # no puede existir en la base; no hace falta consultar
        with self._lock:
            try:
                if self._conn is None or self._conn.closed:
                    self._conn = psycopg.connect(
                        self.database_url, connect_timeout=self.connect_timeout, autocommit=True)
                row = self._conn.execute(SQL_RIDE_ACTIVE, (rid, uid)).fetchone()
                return row is not None
            except psycopg.Error as exc:
                self._drop()
                log.error("No se pudo verificar la rodada: %s", type(exc).__name__)
                raise RideUnverifiable(type(exc).__name__) from exc

    def _drop(self):
        try:
            if self._conn is not None:
                self._conn.close()
        except Exception:
            pass
        self._conn = None


class CachedRideRegistry(RideRegistry):
    """Caché corta: positivos 10 s, negativos 3 s. Los errores de la base no se cachean."""

    def __init__(self, inner, clock=time.monotonic, positive_ttl=POSITIVE_TTL_S, negative_ttl=NEGATIVE_TTL_S):
        self.inner, self.clock = inner, clock
        self.positive_ttl, self.negative_ttl = positive_ttl, negative_ttl
        self._cache = {}  # (user_id, ride_id) -> (resultado, vence)
        self._lock = threading.Lock()

    def is_active(self, user_id, ride_id):
        key, now = (user_id, ride_id), self.clock()
        with self._lock:
            hit = self._cache.get(key)
            if hit and hit[1] > now:
                return hit[0]
        result = self.inner.is_active(user_id, ride_id)  # fuera del candado
        with self._lock:
            if len(self._cache) > 10000:
                self._cache = {k: v for k, v in self._cache.items() if v[1] > now}
            ttl = self.positive_ttl if result else self.negative_ttl
            self._cache[key] = (result, now + ttl)
        return result


def build_registry(database_url, clock=time.monotonic):
    if not database_url:
        log.warning("Sin DATABASE_URL: no se valida la rodada (solo desarrollo).")
        return PermissiveRegistry()
    return CachedRideRegistry(PostgresRideRegistry(database_url), clock=clock)
