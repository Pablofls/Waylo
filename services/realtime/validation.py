"""Validación de mensajes `position` según el contrato (docs/arquitectura.md)."""
import math
from collections import deque
from datetime import datetime, timezone

LAT_MIN, LAT_MAX = 25.4, 26.0
LNG_MIN, LNG_MAX = -100.7, -100.0
MAX_ACCURACY_M = 30
MAX_SPEED_KMH = 80
MAX_JUMP_KMH = 100
MAX_MSGS_PER_SEC = 2
MAX_TS_SKEW_S = 300


class ValidationError(Exception):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code
        self.message = message


def _number(msg, field):
    value = msg.get(field)
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValidationError("invalid_field", f"El campo {field} debe ser un número.")
    return float(value)


def haversine_m(lat1, lng1, lat2, lng2):
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def validate_position(msg, now_wall, prev=None, prev_time=None):
    """Devuelve la posición limpia o lanza ValidationError.

    `now_wall` y `prev_time` son segundos (reloj monotónico del servidor); `prev` es la
    última posición aceptada del mismo usuario.
    """
    ride_id = msg.get("ride_id")
    if not isinstance(ride_id, str) or not ride_id or len(ride_id) > 64:
        raise ValidationError("invalid_field", "El campo ride_id es obligatorio.")
    lat, lng = _number(msg, "latitude"), _number(msg, "longitude")
    speed, heading = _number(msg, "speed"), _number(msg, "heading")
    accuracy = _number(msg, "accuracy")
    if not (LAT_MIN <= lat <= LAT_MAX and LNG_MIN <= lng <= LNG_MAX):
        raise ValidationError("out_of_area", "La posición está fuera de la zona metropolitana.")
    if accuracy < 0 or accuracy > MAX_ACCURACY_M:
        raise ValidationError("low_accuracy", f"La precisión debe ser de {MAX_ACCURACY_M} m o mejor.")
    if not 0 <= speed <= MAX_SPEED_KMH:
        raise ValidationError("invalid_speed", f"La velocidad debe estar entre 0 y {MAX_SPEED_KMH} km/h.")
    if not 0 <= heading <= 359:
        raise ValidationError("invalid_heading", "El rumbo debe estar entre 0 y 359.")

    server_now = datetime.now(timezone.utc)
    ts = server_now
    if msg.get("ts") is not None:
        try:
            ts = datetime.fromisoformat(str(msg["ts"]).replace("Z", "+00:00"))
        except ValueError:
            raise ValidationError("invalid_ts", "El campo ts no es una fecha ISO válida.")
        if ts.tzinfo is None:
            raise ValidationError("invalid_ts", "El campo ts debe incluir zona horaria.")
        if abs((ts - server_now).total_seconds()) > MAX_TS_SKEW_S:
            raise ValidationError("invalid_ts", "El campo ts está demasiado lejos de la hora del servidor.")

    if prev is not None and prev_time is not None:
        dt = now_wall - prev_time
        dist = haversine_m(prev["latitude"], prev["longitude"], lat, lng)
        if dt <= 0:
            if dist > 0:
                raise ValidationError("gps_jump", "Salto de GPS descartado.")
        elif dist / dt * 3.6 > MAX_JUMP_KMH:
            raise ValidationError("gps_jump", "Salto de GPS descartado.")

    return {
        "ride_id": ride_id,
        "latitude": lat,
        "longitude": lng,
        "speed": speed,
        "heading": int(heading),
        "accuracy": accuracy,
        "ts": ts.isoformat(),
    }


class RateLimiter:
    """Ventana deslizante de 1 s por conexión."""

    def __init__(self, limit=MAX_MSGS_PER_SEC):
        self.limit = limit
        self._times = deque()

    def allow(self, now):
        while self._times and now - self._times[0] >= 1.0:
            self._times.popleft()
        if len(self._times) >= self.limit:
            return False
        self._times.append(now)
        return True
