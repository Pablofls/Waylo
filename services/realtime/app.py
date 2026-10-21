"""Servicio en tiempo real de Waylo (Flask + Flask-Sock). Ejecutar con UN solo worker."""
import logging
import os
import threading
import time

import jwt
from flask import Flask, jsonify, request
from flask_sock import Sock
from simple_websocket import ConnectionClosed

from hub import Client, Hub
from store import BatchWriter, build_store

log = logging.getLogger("waylo.realtime")

RECV_TIMEOUT_S = 5


class WsConn:
    """Adaptador entre el hub y la conexión de simple-websocket."""

    def __init__(self, ws):
        self.ws = ws
        self._lock = threading.Lock()

    def send(self, data):
        with self._lock:
            self.ws.send(data)

    def close(self, code, reason=""):
        self.ws.close(code, reason)


def create_app(secret=None, store=None, clock=time.monotonic, start_background=True):
    secret = secret or os.environ.get("WS_JWT_SECRET", "")
    app = Flask(__name__)
    app.config["SOCK_SERVER_OPTIONS"] = {"ping_interval": 25}
    sock = Sock(app)
    store = store or build_store(os.environ.get("DATABASE_URL"))
    writer = BatchWriter(store, max_size=50, interval=5.0, clock=clock)
    hub = Hub(writer, clock=clock)
    app.hub, app.writer = hub, writer

    if start_background:
        def loop():
            while True:
                time.sleep(1)
                try:
                    hub.sweep()
                except Exception as exc:
                    log.error("Error en el barrido: %s", type(exc).__name__)
        threading.Thread(target=loop, daemon=True, name="sweeper").start()

    @app.get("/health")
    def health():
        return jsonify(status="ok", **hub.stats())

    def authenticate(role):
        token = request.args.get("token", "")
        if not secret or not token or request.args.get("role") != role:
            return None
        try:
            claims = jwt.decode(token, secret, algorithms=["HS256"], options={"require": ["exp", "sub"]})
        except jwt.PyJWTError:
            return None
        if claims.get("role") != role:
            return None
        return claims

    @sock.route("/ws")
    def ws_route(ws):
        role = request.args.get("role")
        claims = authenticate(role) if role in ("gps", "map") else None
        if claims is None:
            ws.close(4401, "unauthorized")
            return
        allow = claims.get("allow") or []
        client = Client(WsConn(ws), role, str(claims["sub"]), [str(a) for a in allow])
        exp = float(claims["exp"])
        hub.add_client(client)
        log.info("Conectado: user=%s role=%s", client.user_id, role)
        try:
            while True:
                if time.time() >= exp:
                    ws.close(4401, "token expired")
                    return
                try:
                    raw = ws.receive(timeout=RECV_TIMEOUT_S)
                except ConnectionClosed:
                    return
                if raw is None:
                    continue
                if role == "gps":
                    hub.handle_gps_message(client, raw)
                else:
                    hub._send(client, {"type": "error", "code": "not_allowed",
                                       "message": "El rol map no envía mensajes."})
        finally:
            hub.remove_client(client)
            log.info("Desconectado: user=%s", client.user_id)

    return app


if os.environ.get("WS_JWT_SECRET"):
    app = create_app()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    host = os.environ.get("REALTIME_HOST", "127.0.0.1")
    port = int(os.environ.get("REALTIME_PORT", "5950"))
    create_app().run(host=host, port=port, threaded=True)
