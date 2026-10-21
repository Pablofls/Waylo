"""Estado en memoria y difusión. No depende de WebSockets: las conexiones son objetos con
`send(str)` y `close(code, reason)`."""
import json
import logging
import threading
import time

from rides import RideUnverifiable
from validation import RateLimiter, ValidationError, validate_position

log = logging.getLogger("waylo.hub")

EXPIRE_S = 60
ABUSE_LIMIT = 20  # mensajes inválidos o excedidos seguidos antes de cerrar la conexión


class Client:
    def __init__(self, conn, role, user_id, allow=()):
        self.conn, self.role, self.user_id = conn, role, user_id
        self.allow = set(allow)
        self.limiter = RateLimiter()
        self.strikes = 0


class Hub:
    def __init__(self, writer, registry, clock=time.monotonic):
        self.writer, self.registry, self.clock = writer, registry, clock
        self._lock = threading.RLock()
        self._clients = set()
        self._positions = {}  # user_id -> {"position": dict, "time": float}

    # --- conexiones ---
    def add_client(self, client):
        with self._lock:
            self._clients.add(client)
            if client.role != "map":
                return None
            positions = [p["position"] for uid, p in self._positions.items() if uid in client.allow]
        self._send(client, {"type": "snapshot", "positions": positions})

    def remove_client(self, client):
        with self._lock:
            self._clients.discard(client)

    def stats(self):
        with self._lock:
            return {"connections": len(self._clients), "active_positions": len(self._positions)}

    # --- mensajes del cliente gps ---
    def handle_gps_message(self, client, raw):
        now = self.clock()
        if not client.limiter.allow(now):
            return self._reject(client, "rate_limited", "Máximo 2 mensajes por segundo.")
        try:
            msg = json.loads(raw)
        except (TypeError, ValueError):
            return self._reject(client, "invalid_json", "El mensaje no es JSON válido.")
        if not isinstance(msg, dict):
            return self._reject(client, "invalid_json", "El mensaje debe ser un objeto.")

        kind = msg.get("type")
        if kind == "stop":
            client.strikes = 0
            return self._stop(client.user_id)
        if kind != "position":
            return self._reject(client, "invalid_type", "Tipo de mensaje no permitido.")

        # La consulta de la rodada puede tardar (Postgres): va fuera del candado.
        try:
            if not self.registry.is_active(client.user_id, msg.get("ride_id")):
                return self._reject(client, "ride_invalida", "La rodada no existe, no es tuya o ya terminó.")
        except RideUnverifiable:
            return self._reject(client, "ride_no_verificable", "No se pudo verificar la rodada; intenta de nuevo.")

        with self._lock:
            prev = self._positions.get(client.user_id)
        try:
            pos = validate_position(
                msg, now,
                prev["position"] if prev else None,
                prev["time"] if prev else None,
            )
        except ValidationError as exc:
            return self._reject(client, exc.code, exc.message)

        client.strikes = 0
        pos["user_id"] = client.user_id
        with self._lock:
            self._positions[client.user_id] = {"position": pos, "time": now}
        self.writer.add(dict(pos))  # solo encola; el hilo escritor habla con Postgres
        self._broadcast(client.user_id, {"type": "update", "position": pos})

    def _reject(self, client, code, message):
        client.strikes += 1
        self._send(client, {"type": "error", "code": code, "message": message})
        if client.strikes >= ABUSE_LIMIT:
            log.warning("Cierre por abuso: user=%s", client.user_id)
            self._close(client, 4429, "abuso")

    def _stop(self, user_id):
        with self._lock:
            existed = self._positions.pop(user_id, None)
        if existed:
            self._broadcast(user_id, {"type": "offline", "user_id": user_id})

    # --- mantenimiento (hilo de fondo) ---
    def sweep(self):
        now = self.clock()
        with self._lock:
            expired = [u for u, p in self._positions.items() if now - p["time"] >= EXPIRE_S]
            for u in expired:
                del self._positions[u]
        for u in expired:
            self._broadcast(u, {"type": "offline", "user_id": u})

    # --- envío ---
    def _broadcast(self, user_id, payload):
        with self._lock:
            targets = [c for c in self._clients if c.role == "map" and user_id in c.allow]
        for c in targets:
            self._send(c, payload)

    def _send(self, client, payload):
        try:
            client.conn.send(json.dumps(payload))
        except Exception:
            self.remove_client(client)

    def _close(self, client, code, reason):
        try:
            client.conn.close(code, reason)
        except Exception:
            pass
        self.remove_client(client)
