# Servicio en tiempo real de Waylo

Flask + Flask-Sock. Recibe el GPS real de teléfonos autenticados (`role=gps`), valida, guarda el estado actual en memoria, difunde a quienes tienen permiso (`role=map`) y escribe el historial por lotes. No simula vehículos ni genera movimiento. Contrato: `docs/arquitectura.md`.

- `GET /health`: `{"status":"ok","connections":N,"active_positions":N}`.
- `GET /ws?role=gps|map&token=<JWT>`: JWT HS256 firmado con `WS_JWT_SECRET`. Cierre 4401 si falta, es inválido, está vencido o el rol no coincide. Un token que vence con la conexión abierta también cierra con 4401 (el cliente debe reconectar con uno nuevo). Cierre 4429 por abuso reiterado.
- Un solo proceso: el estado vive en memoria, usa **un** worker de gunicorn.

## Validación de la rodada y persistencia
- Con `DATABASE_URL` definida, cada `position` exige que `ride_id` sea una rodada del usuario del token y en curso (`finalizada_en IS NULL AND eliminada_en IS NULL`). Si no: `error` con `ride_invalida`. Si la base no responde: `ride_no_verificable` (**falla cerrado**, nunca se acepta por defecto). Caché de 10 s para aciertos y 3 s para rechazos; los errores de la base no se cachean. El servicio nunca crea rodadas (la app crea una "Ubicación compartida" cuando se comparte sin rodada).
- Sin `DATABASE_URL` (solo desarrollo) no se valida la rodada y el historial no se guarda; el log lo avisa.
- El historial se escribe en `ride_points` con un hilo escritor y una cola: el hub solo encola, así que una base lenta no bloquea a los clientes. Lotes de 50 puntos o 5 s, `ON CONFLICT (ride_id, ts) DO NOTHING`, reintentos ante errores transitorios y tope de 5000 puntos pendientes. Al recibir SIGTERM se vacía la cola.
- `/health` incluye `store` (`postgres` o `null`), `pending` (puntos en cola) y `last_write_error` (solo el tipo de error).
- En los logs solo hay ids y tipos de error, nunca coordenadas ni tokens.

## Desarrollo
```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest
```
La prueba de integración (`tests/test_integration_db.py`) se omite sin `TEST_DATABASE_URL`. Para correrla (en la VM) la URL debe traer `search_path=waylo,public`, igual que `DATABASE_URL`; crea una persona y una rodada de prueba y borra todo al terminar:
```bash
set -a; . /etc/waylo/waylo.env; set +a; export TEST_DATABASE_URL="$DATABASE_URL"
.venv/bin/python -m pytest -m integration -v
```

## Probar el protocolo
`tools/make_token.py` genera un JWT de prueba (no genera posiciones).
```bash
export WS_JWT_SECRET=<secreto local>
python tools/make_token.py --role map --user viewer --allow u1
python tools/make_token.py --role gps --user u1
```
Conecta con cualquier cliente WebSocket a `ws://127.0.0.1:5950/ws?role=...&token=...` y envía mensajes `position` / `stop` del contrato.
