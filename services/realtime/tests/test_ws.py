"""Pruebas de autenticación contra un servidor real (mensajes fijos, sin simulación)."""
import json
import threading
import time

import jwt
import pytest
from simple_websocket import Client, ConnectionClosed
from werkzeug.serving import make_server

from app import create_app

SECRET = "secreto-de-prueba-solo-para-pytest-32b"


@pytest.fixture(scope="module")
def base():
    app = create_app(secret=SECRET, start_background=False)

    srv = make_server("127.0.0.1", 0, app, threaded=True)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"ws://127.0.0.1:{srv.server_port}/ws"
    srv.shutdown()


def token(role="gps", sub="u1", exp_in=300, secret=SECRET, **extra):
    return jwt.encode({"sub": sub, "role": role, "exp": int(time.time()) + exp_in, **extra},
                      secret, algorithm="HS256")


def close_code(url):
    c = Client.connect(url)
    try:
        c.receive(timeout=3)
    except ConnectionClosed as e:
        return e.reason
    return None


def test_token_valido_conecta_y_map_recibe_snapshot(base):
    c = Client.connect(f"{base}?role=map&token={token('map', 'v', allow=['u1'])}")
    assert json.loads(c.receive(timeout=3)) == {"type": "snapshot", "positions": []}
    c.close()


def test_gps_publica_y_map_recibe_update(base):
    m = Client.connect(f"{base}?role=map&token={token('map', 'v', allow=['u1'])}")
    m.receive(timeout=3)
    g = Client.connect(f"{base}?role=gps&token={token('gps', 'u1')}")
    g.send(json.dumps({"type": "position", "ride_id": "r1", "latitude": 25.66,
                       "longitude": -100.41, "speed": 10, "heading": 90, "accuracy": 5}))
    upd = json.loads(m.receive(timeout=3))
    assert upd["type"] == "update" and upd["position"]["user_id"] == "u1"
    g.close(); m.close()


@pytest.mark.parametrize("url_suffix", [
    "?role=gps",
    "?role=gps&token=basura",
    "?role=gps&token=" + token("gps", secret="otro-secreto-distinto-de-32-bytes!!"),
    "?role=gps&token=" + token("gps", exp_in=-10),
    "?role=map&token=" + token("gps"),
    "?role=otro&token=" + token("gps"),
])
def test_rechazos_cierran_con_4401(base, url_suffix):
    assert close_code(base + url_suffix) == 4401
