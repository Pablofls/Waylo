# Arquitectura de Waylo (fases 2 a 4)

Contrato común para las sesiones de trabajo en paralelo. Si algo de aquí cambia, se cambia primero en este documento.

## Resumen

```
 Teléfono / navegador (Next.js + MapLibre)
        |  https (443)                     wss (443)
        v                                    v
   ┌─────────────────────── Nginx (VM) ───────────────────────┐
   |  /        -> 127.0.0.1:3100  (Next.js: web + API)         |
   |  /ws      -> 127.0.0.1:5950  (Flask + Flask-Sock)         |
   |  /health/waylo -> 127.0.0.1:5950/health                   |
   └──────────────┬──────────────────────────┬─────────────────┘
                  v                          v
            Next.js (API)  ── JWT ──>  Servicio en tiempo real
                  |                          |  valida, guarda estado actual,
                  v                          v  difunde snapshot/update
              PostgreSQL 16 + PostGIS  <── escribe historial por lotes
                       (waylo_db)
```

Inspirada en la arquitectura "Rastreo GPS en tiempo real con WebSockets" de la clase: un publicador GPS, un microservicio Flask + Flask-Sock y un mapa que recibe `snapshot` y `update`. En Waylo el publicador es el teléfono (o el modo simulación) y el historial **sí se persiste** en Postgres.

## Piezas y puertos

| Pieza | Tecnología | Puerto | Expuesto por Nginx |
|---|---|---|---|
| Web y API | Next.js (`next start`) | `127.0.0.1:3100` | `/` |
| Tiempo real | Python 3.12, Flask, Flask-Sock | `127.0.0.1:5950` | `/ws` y `/health/waylo` |
| Base de datos | PostgreSQL 16 + PostGIS | `127.0.0.1:5432` | No |

Puertos que **no** se deben usar (ocupados por otros proyectos de la VM): 22, 25, 80, 443, 3000, 5000, 5002 a 5006, 5432, 5900, 6379, 8000, 55432, 56379.

## Protocolo WebSocket

Endpoint: `wss://<host>/ws?role=gps|map&token=<JWT>`

### Autenticación
Next.js emite un JWT corto (5 min, HS256, secreto `WS_JWT_SECRET`) desde `POST /api/ws-token`. Claims:
- `sub`: id del usuario.
- `role`: `gps` o `map`; debe coincidir con el parámetro de la URL.
- `allow`: (solo `map`) ids de usuarios cuya posición puede ver quien conecta (quienes comparten con él).
- `exp`.

El cliente renueva el token antes de que venza. Sin token válido, el servicio cierra con código 4401.

### Mensajes del cliente `role=gps`
```json
{ "type": "position", "ride_id": "ride_88", "latitude": 25.6605, "longitude": -100.4170,
  "speed": 13.2, "heading": 270, "accuracy": 8, "ts": "2026-10-20T07:21:04-06:00" }
```
```json
{ "type": "stop", "ride_id": "ride_88" }
```
- `speed` en km/h, `heading` 0 a 359, `accuracy` en metros.
- El `user_id` sale del token, nunca del mensaje.

### Mensajes del servidor a `role=map`
| `type` | Cuándo | Contenido |
|---|---|---|
| `snapshot` | Al conectar | `{ "positions": [ { user_id, ride_id, latitude, longitude, speed, heading, ts } ] }` |
| `update` | Cada posición válida | `{ "position": { ... } }` |
| `offline` | Al recibir `stop` o tras 60 s sin mensajes | `{ "user_id": "..." }` |
| `error` | Mensaje inválido o no permitido | `{ "code": "...", "message": "..." }` |

Solo se envían posiciones de usuarios en `allow`. Ping cada 25 s.

### Validación (en el servicio)
- Latitud y longitud dentro de la zona metropolitana ampliada: lat 25.4 a 26.0, lng -100.7 a -100.0.
- `accuracy` ≤ 30 m (se descartan lecturas peores, igual que en el cliente).
- `speed` entre 0 y 80 km/h; `heading` entre 0 y 359.
- Máximo 2 mensajes por segundo por conexión.
- Posición que exceda 100 km/h entre dos puntos consecutivos se descarta como salto de GPS.

### Persistencia
El servicio guarda el estado actual en memoria y escribe el historial a la tabla `ride_points` en lotes (cada 5 s o 50 puntos). El esquema lo define la sesión de base de datos (`db/migrations`).

## Variables de entorno

| Variable | Quién | Ejemplo |
|---|---|---|
| `WEB_PORT` | Next.js | `3100` |
| `REALTIME_HOST` | Flask | `127.0.0.1` |
| `REALTIME_PORT` | Flask | `5950` |
| `DATABASE_URL` | Next.js y Flask | `postgres://waylo_app:***@127.0.0.1:5432/waylo_db` |
| `WS_JWT_SECRET` | Next.js y Flask | cadena aleatoria de 32+ bytes |
| `SESSION_SECRET` | Next.js | cadena aleatoria de 32+ bytes |
| `NEXT_PUBLIC_WS_URL` | Cliente | `wss://34-51-108-167.sslip.io/ws` |
| `NEXT_PUBLIC_MAPTILER_KEY` | Cliente | opcional |

Los secretos viven en archivos `.env` de la VM (fuera de Git). En el repo solo van `.env.example`.

## Estructura del repositorio

```
src/                  Web (Next.js), ya existe
db/
  migrations/         SQL numerado (001_*.sql, 002_*.sql ...)
  seeds/              Datos de ejemplo derivados de src/mocks
  apply.sh            Aplica migraciones en orden (idempotente)
services/realtime/
  app.py              Flask + Flask-Sock
  requirements.txt
  simulator.py        Equivalente al GPSapp de la clase
  tests/
deploy/
  nginx/waylo.conf
  systemd/waylo-web.service, waylo-realtime.service
  deploy.sh           pull, build, migraciones y reinicio
docs/                 Este documento, vm-setup.md, sesiones.md
```

## Base de datos

- Base `waylo_db`, dueño `waylo_user` (migraciones), rol de la app `waylo_app` (solo lectura y escritura de datos, sin DDL).
- PostGIS para trazas y puntos (`geography(Point, 4326)`, `geography(LineString, 4326)`).
- Convención: ids `uuid`, fechas `timestamptz`, textos en español de México.
- Esta base comparte instancia con `libreria_db`: nunca tocar objetos de otros proyectos.

## Flujo de trabajo con Git

1. Cada sesión trabaja en su rama (`db-esquema`, `realtime`, `despliegue`, `app-datos`) y abre pull request a `main`.
2. Nadie hace push directo ni force push a `main`.
3. En la VM: `git pull` en `main`, luego `deploy/deploy.sh` (y `db/apply.sh` cuando haya migraciones nuevas).

## Pendiente de decidir
- Si PostGIS no se puede instalar en la VM, la sesión de base de datos usará `double precision` para lat/lng y se documentará el cambio.
- Dominio definitivo (hoy `34-51-108-167.sslip.io`) e IP estática reservada en Google Cloud.
