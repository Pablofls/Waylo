# Sesión B: Servicio en tiempo real (Flask + Flask-Sock)

## Cómo abrir esta sesión

> Esta sesión ya se completó y se integró a `main`. Si hubiera que repetirla, usa un nombre de rama nuevo (por ejemplo `realtime-2`).

1. En tu Mac, crea una carpeta de trabajo propia (un `git worktree`) desde `main`:

```bash
cd ~/Claude/Waylo-main && git fetch origin && git worktree add ../Waylo-realtime -b realtime origin/main
```

2. Después abre una sesión nueva apuntando a esa carpeta (`Waylo-realtime`) y escribe:

```text
Ejecuta docs/prompts/sesion-b-tiempo-real.md
```

**Rama:** `realtime`. Antes de empezar lee y cumple `docs/prompts/reglas-comunes.md` (crea tu rama desde `main`, no toques `main`, trabaja solo en `services/realtime/**`).

## Contexto
Lee `docs/arquitectura.md` completo, en especial **Protocolo WebSocket** y **GPS real, sin simulación**. Waylo toma las posiciones del GPS real de los teléfonos; el servicio las valida, guarda el estado actual y el historial, y las difunde a quienes tienen permiso de verlas (ubicación en vivo y seguimiento). Está inspirado en el "Monterrey GPS Tracker" de la clase (roles `gps` y `map`, mensajes `snapshot` y `update`, `/health`), pero **sin vehículos simulados** y con historial persistente.

## Alcance (todo en `services/realtime/`)
- `app.py`: Flask + Flask-Sock. Escucha en `REALTIME_HOST:REALTIME_PORT` (por defecto `127.0.0.1:5950`).
- `GET /health`: responde `ok` y estado (conexiones, posiciones activas).
- `GET /ws?role=gps|map&token=<JWT>`:
  - Verifica JWT HS256 con `WS_JWT_SECRET`; el `role` del token debe coincidir con el de la URL; cierra con 4401 si falla. Un token vencido cierra con 4401.
  - `role=gps`: recibe `position` y `stop`. El `user_id` sale del token, nunca del mensaje. Un `position` solo se acepta si su `ride_id` pertenece a ese usuario y la rodada está en curso (consulta a la base de datos con caché corta, detrás de la interfaz de almacenamiento); si no, responde `error` con código `ride_invalida`.
  - `role=map`: al conectar recibe `snapshot` con las posiciones activas de los usuarios en `allow`; después `update`, `offline` y `error`, según el contrato.
  - Ping cada 25 s; cierra conexiones muertas.
- **Validación** según el contrato: rango geográfico del AMM, `accuracy` ≤ 30 m, `speed` 0 a 80 km/h, `heading` 0 a 359, máx. 2 mensajes por segundo por conexión, descartar saltos mayores a 100 km/h entre puntos consecutivos. Los mensajes inválidos responden `error` sin cerrar la conexión (salvo abuso reiterado).
- Estado actual en memoria; expiración a los 60 s sin mensajes (`offline`).
- **Persistencia** del historial a `ride_points` (`ride_id`, `geog`, `speed`, `heading`, `accuracy`, `ts`; **sin `user_id`**, por normalización) por lotes (cada 5 s o 50 puntos) con `psycopg` 3 y `DATABASE_URL` (rol `waylo_app`). Aísla la escritura detrás de una interfaz (`PositionStore`) para poder probar sin base de datos. Si la sesión A ya está en `main` (revisa `db/migrations`), implementa contra el esquema real; si no, deja la interfaz y una implementación pendiente, y dilo claramente.
- Un solo proceso: el estado vive en memoria, así que ejecútalo con **un** worker (por ejemplo `gunicorn -w 1 -k gthread --threads 50`).
- `requirements.txt` con versiones fijadas, `README.md`, `.env.example` (sin secretos) y `tools/make_token.py` para generar un JWT de prueba con un secreto local (herramienta de desarrollo para probar el protocolo, no un simulador de vehículos).

## Qué NO hacer
- **No crees un simulador de vehículos ni generes movimiento.** La única fuente es el GPS real de clientes autenticados.
- No sirvas páginas web (la web la sirve Next.js).
- No incluyas secretos ni datos personales en logs; registra solo ids y errores.

## Pruebas (pytest)
Pruebas automatizadas con mensajes **fijos y concretos** (no trayectos simulados): autenticación (token válido, vencido, rol incorrecto), validación de cada regla del contrato, límite de mensajes, `snapshot` y `update` solo para usuarios en `allow`, `offline` por `stop` y por tiempo, y persistencia por lotes con un almacenamiento falso.

## Entrega
1. Rama `realtime` subida y actualizada con `origin/main`.
2. Resumen de decisiones y de lo que falte por la dependencia con A.
3. **Comandos exactos para la VM**, en orden: crear el entorno virtual en `~/Waylo/services/realtime`, instalar `requirements.txt`, variables de entorno necesarias (sin pedírmelas en el chat), arrancarlo con gunicorn en `127.0.0.1:5950`, verificar con `curl http://127.0.0.1:5950/health` y probar el WebSocket con el token de `tools/make_token.py`.
