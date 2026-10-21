"""Integración contra Postgres real (se corre en la VM). Se omite sin TEST_DATABASE_URL.

Crea una persona y una rodada de prueba, escribe puntos fijos por el almacén real y limpia todo lo
que creó, aunque la prueba falle (borrar `usuario` cascada a rodada y ride_points).
"""
import os
import uuid

import psycopg
import pytest

from rides import PostgresRideRegistry
from store import PostgresPositionStore

URL = os.environ.get("TEST_DATABASE_URL")
pytestmark = [pytest.mark.integration, pytest.mark.skipif(not URL, reason="Falta TEST_DATABASE_URL")]


def point(ride_id, second, **over):
    p = {"user_id": "no-se-guarda", "ride_id": ride_id, "latitude": 25.6605, "longitude": -100.4170,
         "speed": 13.2, "heading": 270, "accuracy": 8.0, "ts": f"2026-10-20T13:00:{second:02d}+00:00"}
    p.update(over)
    return p


@pytest.fixture
def ride():
    user_id = str(uuid.uuid4())
    with psycopg.connect(URL, autocommit=True) as conn:
        try:
            conn.execute("INSERT INTO usuario (id, nombre, correo) VALUES (%s, %s, %s)",
                         (user_id, "Prueba B2", f"prueba-b2-{user_id}@example.invalid"))
            vehiculo = conn.execute("SELECT clave FROM cat_tipo_vehiculo LIMIT 1").fetchone()[0]
            ride_id = str(conn.execute(
                "INSERT INTO rodada (usuario_id, titulo, vehiculo_clave) VALUES (%s, 'Prueba B2', %s) RETURNING id",
                (user_id, vehiculo)).fetchone()[0])
            yield conn, user_id, ride_id
        finally:
            conn.execute("DELETE FROM usuario WHERE id = %s", (user_id,))


def count(conn, ride_id):
    return conn.execute("SELECT count(*) FROM ride_points WHERE ride_id = %s", (ride_id,)).fetchone()[0]


def test_escribe_puntos_ignora_duplicados_y_guarda_geografia(ride):
    conn, user_id, ride_id = ride
    store = PostgresPositionStore(URL)
    store.save_points([point(ride_id, 1), point(ride_id, 2), point(ride_id, 3)])
    store.save_points([point(ride_id, 3), point(ride_id, 4)])  # el 3 ya existe
    assert count(conn, ride_id) == 4
    lat, lng = conn.execute(
        "SELECT ST_Y(geog::geometry), ST_X(geog::geometry) FROM ride_points WHERE ride_id = %s LIMIT 1",
        (ride_id,)).fetchone()
    assert (round(lat, 4), round(lng, 4)) == (25.6605, -100.4170)


def test_rodada_borrada_entre_medias_no_tira_el_lote(ride):
    conn, user_id, ride_id = ride
    store = PostgresPositionStore(URL)
    store.save_points([point(str(uuid.uuid4()), 1), point(ride_id, 2)])
    assert count(conn, ride_id) == 1


def test_registro_de_rodadas(ride):
    conn, user_id, ride_id = ride
    reg = PostgresRideRegistry(URL)
    assert reg.is_active(user_id, ride_id) is True
    assert reg.is_active(str(uuid.uuid4()), ride_id) is False  # de otra persona
    assert reg.is_active(user_id, str(uuid.uuid4())) is False  # no existe
    conn.execute("UPDATE rodada SET finalizada_en = now() + interval '1 second' WHERE id = %s", (ride_id,))
    assert reg.is_active(user_id, ride_id) is False  # finalizada
