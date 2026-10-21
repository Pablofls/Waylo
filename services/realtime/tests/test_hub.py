import json
from datetime import datetime, timezone

import pytest

from hub import Client, Hub
from store import BatchWriter, PositionStore


class FakeConn:
    def __init__(self):
        self.sent, self.closed = [], None

    def send(self, data):
        self.sent.append(json.loads(data))

    def close(self, code, reason=""):
        self.closed = code


class FakeStore(PositionStore):
    def __init__(self):
        self.batches = []

    def save_points(self, points):
        self.batches.append(points)


class Clock:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


def pos(**over):
    msg = {"type": "position", "ride_id": "ride_1", "latitude": 25.6605, "longitude": -100.4170,
           "speed": 13.2, "heading": 270, "accuracy": 8}
    msg.update(over)
    return json.dumps(msg)


@pytest.fixture
def env():
    clock, store = Clock(), FakeStore()
    hub = Hub(BatchWriter(store, clock=clock), clock=clock)
    return hub, clock, store


def connect(hub, role, user, allow=()):
    c = Client(FakeConn(), role, user, allow)
    hub.add_client(c)
    return c


def last(c):
    return c.conn.sent[-1]


def test_snapshot_vacio_y_con_posiciones_solo_de_allow(env):
    hub, clock, _ = env
    g1, g2 = connect(hub, "gps", "u1"), connect(hub, "gps", "u2")
    hub.handle_gps_message(g1, pos())
    hub.handle_gps_message(g2, pos(latitude=25.7))
    m = connect(hub, "map", "viewer", ["u1"])
    snap = m.conn.sent[0]
    assert snap["type"] == "snapshot"
    assert [p["user_id"] for p in snap["positions"]] == ["u1"]
    assert connect(hub, "map", "otro").conn.sent[0] == {"type": "snapshot", "positions": []}


def test_update_solo_para_allow_y_user_id_sale_del_token(env):
    hub, _, _ = env
    permitido = connect(hub, "map", "a", ["u1"])
    ajeno = connect(hub, "map", "b", ["u9"])
    g = connect(hub, "gps", "u1")
    hub.handle_gps_message(g, pos(user_id="falso"))
    upd = last(permitido)
    assert upd["type"] == "update" and upd["position"]["user_id"] == "u1"
    assert len(ajeno.conn.sent) == 1  # solo su snapshot


@pytest.mark.parametrize("over,code", [
    ({"latitude": 24.0}, "out_of_area"),
    ({"longitude": -99.0}, "out_of_area"),
    ({"accuracy": 31}, "low_accuracy"),
    ({"speed": 81}, "invalid_speed"),
    ({"speed": -1}, "invalid_speed"),
    ({"heading": 360}, "invalid_heading"),
    ({"heading": -1}, "invalid_heading"),
    ({"ride_id": ""}, "invalid_field"),
    ({"latitude": "25.6"}, "invalid_field"),
    ({"ts": "ayer"}, "invalid_ts"),
    ({"ts": "2020-01-01T00:00:00+00:00"}, "invalid_ts"),
])
def test_validacion_de_cada_regla(env, over, code):
    hub, _, _ = env
    g = connect(hub, "gps", "u1")
    hub.handle_gps_message(g, pos(**over))
    assert last(g)["type"] == "error" and last(g)["code"] == code
    assert g.conn.closed is None
    assert hub.stats()["active_positions"] == 0


def test_limites_validos_se_aceptan(env):
    hub, _, _ = env
    g = connect(hub, "gps", "u1")
    hub.handle_gps_message(g, pos(accuracy=30, speed=80, heading=359,
                                  ts=datetime.now(timezone.utc).isoformat()))
    assert hub.stats()["active_positions"] == 1 and not g.conn.sent


def test_json_invalido_y_tipo_desconocido(env):
    hub, _, _ = env
    g = connect(hub, "gps", "u1")
    hub.handle_gps_message(g, "no es json")
    assert last(g)["code"] == "invalid_json"
    g.limiter._times.clear()
    hub.handle_gps_message(g, json.dumps({"type": "otra"}))
    assert last(g)["code"] == "invalid_type"


def test_limite_de_dos_mensajes_por_segundo(env):
    hub, clock, _ = env
    g = connect(hub, "gps", "u1")
    hub.handle_gps_message(g, pos())
    hub.handle_gps_message(g, pos())
    assert not g.conn.sent
    hub.handle_gps_message(g, pos())
    assert last(g)["code"] == "rate_limited"
    clock.t += 1.0
    n = len(g.conn.sent)
    hub.handle_gps_message(g, pos())
    assert len(g.conn.sent) == n


def test_abuso_reiterado_cierra_conexion(env):
    hub, clock, _ = env
    g = connect(hub, "gps", "u1")
    for _ in range(25):
        clock.t += 1
        hub.handle_gps_message(g, "basura")
    assert g.conn.closed == 4429


def test_salto_mayor_a_100_kmh_se_descarta(env):
    hub, clock, _ = env
    g = connect(hub, "gps", "u1")
    hub.handle_gps_message(g, pos())
    clock.t += 1.0
    # ~1.1 km en 1 s = ~4000 km/h
    hub.handle_gps_message(g, pos(latitude=25.6705))
    assert last(g)["code"] == "gps_jump"
    clock.t += 10.0
    # ~11 m en 10 s = ~4 km/h
    hub.handle_gps_message(g, pos(latitude=25.6606))
    assert hub.stats()["active_positions"] == 1
    assert len(g.conn.sent) == 1


def test_stop_envia_offline(env):
    hub, _, _ = env
    m = connect(hub, "map", "a", ["u1"])
    g = connect(hub, "gps", "u1")
    hub.handle_gps_message(g, pos())
    hub.handle_gps_message(g, json.dumps({"type": "stop", "ride_id": "ride_1"}))
    assert last(m) == {"type": "offline", "user_id": "u1"}
    assert hub.stats()["active_positions"] == 0


def test_offline_por_tiempo_a_los_60_s(env):
    hub, clock, _ = env
    m = connect(hub, "map", "a", ["u1"])
    g = connect(hub, "gps", "u1")
    hub.handle_gps_message(g, pos())
    clock.t += 59
    hub.sweep()
    assert last(m)["type"] == "update"
    clock.t += 1
    hub.sweep()
    assert last(m) == {"type": "offline", "user_id": "u1"}
    assert hub.stats()["active_positions"] == 0


def test_persistencia_por_lotes_de_50_puntos(env):
    hub, clock, store = env
    g = connect(hub, "gps", "u1")
    for _ in range(49):
        clock.t += 1
        hub.handle_gps_message(g, pos())
    assert store.batches == []
    clock.t += 1
    hub.handle_gps_message(g, pos())
    assert len(store.batches) == 1 and len(store.batches[0]) == 50
    assert store.batches[0][0]["user_id"] == "u1"


def test_persistencia_por_lotes_cada_5_s(env):
    hub, clock, store = env
    g = connect(hub, "gps", "u1")
    hub.handle_gps_message(g, pos())
    clock.t += 4
    hub.sweep()
    assert store.batches == []
    clock.t += 1
    hub.sweep()
    assert len(store.batches) == 1 and len(store.batches[0]) == 1


def test_fallo_del_almacen_conserva_puntos(env):
    hub, clock, store = env
    calls = []

    def boom(points):
        calls.append(len(points))
        if len(calls) == 1:
            raise RuntimeError("db caída")
        store.batches.append(points)

    store.save_points = boom
    g = connect(hub, "gps", "u1")
    hub.handle_gps_message(g, pos())
    clock.t += 5
    hub.sweep()
    clock.t += 5
    hub.sweep()
    assert len(store.batches) == 1 and len(store.batches[0]) == 1
