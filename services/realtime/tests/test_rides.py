import json
import time

from hub import Hub
from rides import CachedRideRegistry, RideRegistry, RideUnverifiable
from store import BatchWriter, PositionStore
from tests.test_hub import Clock, FakeRegistry, FakeStore, connect, last, pos

RIDE = "11111111-1111-4111-8111-111111111111"
USER = "22222222-2222-4222-8222-222222222222"


def make(registry):
    clock = Clock()
    hub = Hub(BatchWriter(FakeStore(), start_thread=False), registry, clock=clock)
    return hub, clock


def test_rodada_valida_se_acepta():
    hub, _ = make(FakeRegistry({(USER, RIDE)}))
    g = connect(hub, "gps", USER)
    hub.handle_gps_message(g, pos(ride_id=RIDE))
    assert not g.conn.sent and hub.stats()["active_positions"] == 1


def test_rodada_ajena_finalizada_o_inexistente_da_ride_invalida():
    # El registro devuelve False en los tres casos (otro dueño, finalizada, no existe).
    hub, _ = make(FakeRegistry({("otro-usuario", RIDE)}))
    g = connect(hub, "gps", USER)
    hub.handle_gps_message(g, pos(ride_id=RIDE))
    assert last(g)["code"] == "ride_invalida"
    assert g.conn.closed is None and hub.stats()["active_positions"] == 0
    assert hub.writer.pending == 0


def test_falla_cerrada_si_no_se_puede_verificar():
    reg = FakeRegistry()
    reg.fail = True
    hub, _ = make(reg)
    g = connect(hub, "gps", USER)
    hub.handle_gps_message(g, pos(ride_id=RIDE))
    assert last(g)["code"] == "ride_no_verificable"
    assert hub.stats()["active_positions"] == 0 and hub.writer.pending == 0


def test_stop_no_consulta_la_rodada():
    reg = FakeRegistry()
    hub, _ = make(reg)
    g = connect(hub, "gps", USER)
    hub.handle_gps_message(g, json.dumps({"type": "stop", "ride_id": RIDE}))
    assert reg.calls == 0


class Counting(RideRegistry):
    def __init__(self, result):
        self.result, self.calls, self.fail = result, 0, False

    def is_active(self, user_id, ride_id):
        self.calls += 1
        if self.fail:
            raise RideUnverifiable("x")
        return self.result


def test_cache_positiva_10_s():
    inner, clock = Counting(True), Clock()
    reg = CachedRideRegistry(inner, clock=clock)
    assert reg.is_active(USER, RIDE) and reg.is_active(USER, RIDE)
    assert inner.calls == 1
    clock.t += 9.9
    reg.is_active(USER, RIDE)
    assert inner.calls == 1
    clock.t += 0.2
    reg.is_active(USER, RIDE)
    assert inner.calls == 2


def test_cache_negativa_breve():
    inner, clock = Counting(False), Clock()
    reg = CachedRideRegistry(inner, clock=clock)
    assert not reg.is_active(USER, RIDE) and not reg.is_active(USER, RIDE)
    assert inner.calls == 1
    clock.t += 3.1
    inner.result = True  # la rodada se creó entre medias
    assert reg.is_active(USER, RIDE)
    assert inner.calls == 2


def test_errores_de_la_base_no_se_cachean():
    inner, clock = Counting(True), Clock()
    reg = CachedRideRegistry(inner, clock=clock)
    inner.fail = True
    for _ in range(2):
        try:
            reg.is_active(USER, RIDE)
        except RideUnverifiable:
            pass
    assert inner.calls == 2
    inner.fail = False
    assert reg.is_active(USER, RIDE)


def test_ride_id_que_no_es_uuid_no_consulta_la_base():
    from rides import PostgresRideRegistry
    reg = PostgresRideRegistry("postgresql://no-se-usa")
    assert reg.is_active(USER, "ride_88") is False
    assert reg.is_active("u1", RIDE) is False


class SlowStore(PositionStore):
    def __init__(self):
        self.saved = []

    def save_points(self, points):
        time.sleep(0.6)
        self.saved.extend(points)


def test_hub_no_se_bloquea_con_almacen_lento_y_close_vacia_la_cola():
    store = SlowStore()
    writer = BatchWriter(store, max_size=2, interval=0.1)
    hub = Hub(writer, FakeRegistry(), clock=Clock())
    g = connect(hub, "gps", "u1")
    t0 = time.monotonic()
    for i in range(5):
        hub.clock.t += 1
        hub.handle_gps_message(g, pos())
    assert time.monotonic() - t0 < 0.3
    writer.close()
    assert len(store.saved) == 5 and writer.pending == 0


def test_lote_por_tiempo_con_hilo_escritor():
    store = FakeStore()
    writer = BatchWriter(store, max_size=50, interval=0.2)
    writer.add({"user_id": "u1"})
    deadline = time.monotonic() + 3
    while not store.batches and time.monotonic() < deadline:
        time.sleep(0.05)
    writer.close()
    assert len(store.batches) == 1 and len(store.batches[0]) == 1
