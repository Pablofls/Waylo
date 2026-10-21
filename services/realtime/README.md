# Servicio en tiempo real de Waylo

Flask + Flask-Sock. Recibe el GPS real de teléfonos autenticados (`role=gps`), valida, guarda el estado actual en memoria, difunde a quienes tienen permiso (`role=map`) y escribe el historial por lotes. No simula vehículos ni genera movimiento. Contrato: `docs/arquitectura.md`.

- `GET /health`: `{"status":"ok","connections":N,"active_positions":N}`.
- `GET /ws?role=gps|map&token=<JWT>`: JWT HS256 firmado con `WS_JWT_SECRET`. Cierre 4401 si falta, es inválido, está vencido o el rol no coincide. Un token que vence con la conexión abierta también cierra con 4401 (el cliente debe reconectar con uno nuevo). Cierre 4429 por abuso reiterado.
- Un solo proceso: el estado vive en memoria, usa **un** worker de gunicorn.

## Persistencia (pendiente)
La interfaz `PositionStore` y el escritor por lotes (cada 5 s o 50 puntos) están listos y probados con un almacenamiento falso. `store.build_store` devuelve hoy `NullStore`: **el historial aún no se guarda en Postgres** porque el esquema de `ride_points` (sesión A, `db/migrations`) no está en `main`. Cuando esté, se implementa `PostgresPositionStore` con `psycopg` 3 y `DATABASE_URL`.

## Desarrollo
```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest
```

## Probar el protocolo
`tools/make_token.py` genera un JWT de prueba (no genera posiciones).
```bash
export WS_JWT_SECRET=<secreto local>
python tools/make_token.py --role map --user viewer --allow u1
python tools/make_token.py --role gps --user u1
```
Conecta con cualquier cliente WebSocket a `ws://127.0.0.1:5950/ws?role=...&token=...` y envía mensajes `position` / `stop` del contrato.
