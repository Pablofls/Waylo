# Sesiones de trabajo paralelas

Cada sesión se abre aparte, parte de `main` (con `docs/arquitectura.md` ya incluido) y trabaja en su rama. Todas deben leer primero `docs/arquitectura.md` y `docs/vm-setup.md`.

Reglas comunes para todas:
- Responder y comentar en español de México. Sin emojis en la interfaz.
- Trabajar solo en los archivos de su alcance; no modificar `src/` salvo la sesión C.
- La VM es compartida con otro proyecto: no tocar sus bases, puertos ni bloques de Nginx.
- Nunca poner secretos en Git. Solo archivos `.env.example`.
- No hacer push a `main`: rama propia y pull request.
- Quien opera la VM es el usuario: cada entrega debe incluir los comandos exactos que debe correr ahí.

---

## Sesión A: Base de datos (rama `db-esquema`)

**Prompt**

> Lee `docs/arquitectura.md`, `docs/vm-setup.md` y los tipos y mocks de `src/types` y `src/mocks`, que muestran todos los datos que maneja la app. Diseña el esquema PostgreSQL (con PostGIS si está disponible) para `waylo_db`: usuarios y perfiles, sesiones, vehículos, rodadas y puntos de traza (`ride_points`), reportes con historial de estado y confirmaciones, amistades y solicitudes, bloqueos, rodadas grupales y asistentes, clubes y miembros, retos, notificaciones, lugares y rutas guardadas, contactos de emergencia, comentarios y reacciones, suscripciones y pagos, y comparticiones de ubicación en vivo. Entrega: `docs/base-de-datos.md` con diagrama (Mermaid) y decisiones, migraciones SQL numeradas en `db/migrations`, datos de ejemplo en `db/seeds` derivados de los mocks, índices espaciales y de consulta, permisos para los roles `waylo_user` y `waylo_app`, y `db/apply.sh` idempotente. Explícame cada decisión importante y deja los comandos para correr en la VM.

---

## Sesión B: Servicio en tiempo real (rama `realtime`)

**Prompt**

> Lee `docs/arquitectura.md` (sección Protocolo WebSocket). Implementa en `services/realtime` un microservicio Flask + Flask-Sock que escuche en `REALTIME_HOST:REALTIME_PORT`, con `/ws` (roles `gps` y `map`, JWT HS256, mensajes `snapshot`, `update`, `offline` y `error`), `/health`, validación según el contrato, límite de mensajes, estado actual en memoria, escritura por lotes del historial a la tabla `ride_points` y cierre de conexiones muertas con ping. Incluye `simulator.py` (equivalente al GPSapp: recorre las rutas de `src/mocks/routes.ts` publicando posiciones), pruebas automatizadas y `requirements.txt`. Mientras la sesión A no entregue el esquema, aísla la escritura a Postgres detrás de una interfaz y usa un almacenamiento falso en las pruebas. Deja los comandos para correrlo en la VM.

---

## Sesión D: Despliegue en la VM (rama `despliegue`)

**Prompt**

> Lee `docs/arquitectura.md` y `docs/vm-setup.md`. El servidor es CentOS Stream 10 y ya tiene Nginx sirviendo otro proyecto. Crea en `deploy/`: `nginx/waylo.conf` (server propio para `34-51-108-167.sslip.io` con proxy de `/` a `127.0.0.1:3100`, de `/ws` a `127.0.0.1:5950` con cabeceras de WebSocket y `/health/waylo`; sin tocar los bloques existentes), unidades systemd `waylo-web.service` y `waylo-realtime.service` (usuario sin privilegios, `EnvironmentFile=/etc/waylo/waylo.env`, reinicio automático), `deploy.sh` (git pull, `npm ci`, `next build`, entorno virtual de Python, `db/apply.sh` si existe, reinicio de servicios y verificación de salud) y `.env.example` de producción. Considera SELinux y el firewall. Completa `docs/vm-setup.md` con cualquier corrección y entrégame una lista de comandos exactos, en orden, para ejecutar en la VM.

---

## Sesión C: App con datos reales (rama `app-datos`)

Empieza cuando A y B estén integradas en `main`.

**Prompt**

> Lee `docs/arquitectura.md` y `docs/base-de-datos.md`. Reemplaza los mocks de `src/lib/data` por consultas reales a Postgres (`pg`, sin ORM pesado) y el estado en memoria de `src/lib/social.tsx` por llamadas a rutas API de Next.js. Implementa registro, inicio de sesión y sesiones (contraseñas con hash), `POST /api/ws-token` para el servicio en tiempo real, y conecta el cliente al WebSocket para la ubicación en vivo y el seguimiento. Mantén los componentes sin cambios de interfaz siempre que se pueda. Migra por áreas (cuenta, rodadas, reportes, social, premium) con un commit por área, pruebas de las rutas API y la lista de comandos para correr en la VM.
