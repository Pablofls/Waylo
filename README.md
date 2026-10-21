# Waylo

App web móvil (mobile-first) para ciclistas y usuarios de scooter en el Área Metropolitana de Monterrey. Prioriza llegar seguro: rutas con Safety Score, mapa de calor de riesgo y reportes de la comunidad.

La app (Next.js) ya corre con datos reales: PostgreSQL 16 + PostGIS para la información y el servicio en tiempo real (`services/realtime`) para la ubicación en vivo. La arquitectura completa está en `docs/arquitectura.md` y el esquema en `docs/base-de-datos.md`.

## Cómo correrlo

Requisitos: Node 20+, una base `waylo_db` con las migraciones aplicadas (`db/README.md`) y, para la ubicación en vivo, el servicio en tiempo real corriendo.

```bash
npm install
cp .env.example .env.local   # si no existe, crea .env.local con las variables de abajo
npm run dev                  # http://localhost:3000
```

- La geolocalización del navegador solo funciona en HTTPS (o `localhost`). Para probar el GPS desde un teléfono usa un túnel HTTPS o el dominio de la VM.
- `/design` y `/catalogo` (guía de estilo e índice de pantallas) existen solo en desarrollo.
- En escritorio la app se centra en un contenedor tipo teléfono. Sin GPS (escritorio) no se puede iniciar una rodada: se muestra el aviso de `/permisos/ubicacion`.

### Variables de entorno

Nunca se suben a Git; en la VM viven en `/etc/waylo/waylo.env`.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `DATABASE_URL` | Sí | `postgres://waylo_app:***@127.0.0.1:5432/waylo_db` (rol `waylo_app`, solo DML). La app fija `search_path=waylo,public`. |
| `SESSION_SECRET` | Sí | 32+ caracteres aleatorios. Firma (HMAC) los tokens de sesión, de verificación y de recuperación antes de guardarlos. |
| `WS_JWT_SECRET` | Sí | 32+ caracteres; el mismo que usa el servicio en tiempo real para validar los JWT. |
| `NEXT_PUBLIC_WS_URL` | Sí (tiempo real) | `wss://<host>/ws`. |
| `NEXT_PUBLIC_MAPTILER_KEY` | No | Llave de MapTiler. Vacía usa un estilo gratuito de respaldo (OpenFreeMap). |
| `UPLOADS_DIR` | Recomendada | Carpeta (fuera del repositorio) donde se guardan las fotos de los reportes. Por omisión `./uploads`. |
| `APP_URL` | No | URL pública de la app, para correos. |

Generar un secreto: `openssl rand -base64 48`.

## Scripts

```bash
npm run dev        # servidor de desarrollo
npm run build      # compila para producción
npm run typecheck  # tsc --noEmit
npm test           # pruebas (vitest): validaciones, permisos de las rutas API y lógica pura
```

Las pruebas de las rutas API usan una base falsa (no necesitan Postgres). Las consultas SQL se prueban con `db/verify.sql` y en la VM.

## Estructura

- `src/app`: rutas. `(phone)` agrupa las pantallas; `(tabs)` añade la barra inferior. `src/app/api/**` son las rutas API (una carpeta por área).
- `src/proxy.ts`: redirige a `/login` las pantallas privadas cuando no hay cookie de sesión. Cada ruta API y cada consulta vuelve a validar la sesión.
- `src/server`: acceso a datos y reglas, un módulo por dominio (`cuenta`, `rodadas`, `reportes`, `social`, `grupales`, `clubes`, `logros`, `notificaciones`, `seguridad`, `premium`, `zonas`, `mapas`, `ayuda`...). Consultas parametrizadas con `pg`; lo derivado sale de las vistas de la base. Solo se importa desde el servidor.
- `src/lib/data`: lo que leen las páginas de servidor; toma la persona de la sesión.
- `src/lib/social.tsx`: `useSocial()`, el estado del cliente. Aplica cada cambio al instante, llama a la API y vuelve a pedir los datos al servidor; si falla, lo revierte y muestra el error.
- `src/lib/geo` y `src/lib/realtime`: GPS real (`watchPosition`, precisión ≤ 30 m, Wake Lock), detección de caídas y cliente WebSocket (`role=gps` y `role=map`, con reconexión y renovación del token).
- `src/components`: `ui`, `map`, `domain`, `layout`, `screens`.
- `src/tests`: pruebas.

## Cuenta y seguridad

- Contraseñas con argon2id. Sesión en cookie `httpOnly`, `sameSite=lax` y `secure` en producción; en la base solo se guarda el HMAC del token.
- Verificación de correo (código de 6 dígitos) y recuperación de contraseña (código de 6 dígitos, 15 min). El envío de correo está detrás de la interfaz `Mailer` (`src/server/mail.ts`); **mientras no se configure un proveedor solo escribe en el log del servidor y en producción no manda nada**.
- Límites de intentos en memoria (login, registro, recuperación, verificación, pagos, denuncias...). Válidos con un solo proceso de Next.js, que es como corre en la VM.
- Las rutas API rechazan escrituras desde otro origen, validan con zod y usan siempre el usuario de la sesión (nunca del cuerpo).

## Rodadas con GPS real y tiempo real

1. Al tocar **Iniciar rodada** se verifica el GPS y el permiso (si no hay, se avisa y no empieza).
2. `POST /api/rodadas` crea la rodada y devuelve `ride_id`; solo entonces se transmite.
3. `POST /api/ws-token` emite el JWT corto (`sub`, `role`, `allow`, `exp`, 5 min) y el cliente se conecta a `NEXT_PUBLIC_WS_URL`. Reconecta solo y renueva el token antes de que venza.
4. Al terminar se marca `finalizada_en`. No se guardan km ni minutos: se calculan en la base (`v_rodada_resumen`).

## Pendiente

Ver `docs/propuestas/app-datos.md` para el detalle. En corto:

- **Motor de rutas**: las opciones de ruta salen de consultas ya calculadas; falta conectar un proveedor (OpenRouteService, Valhalla...) para calcular cualquier trayecto y recalcular al desviarse.
- **Proveedor de correo y de SMS/push**: hoy no se envían correos ni se avisa automáticamente a los contactos de emergencia (la persona envía el mensaje desde su app de SMS).
- **Generación de notificaciones** de alertas de ruta, cambios de estado de reportes y recordatorios de rodadas (necesita un proceso programado).
- **Mapas sin conexión**: se registra qué áreas eligió la persona, pero aún no se guardan los mosaicos del mapa.
- **Pagos reales de Premium** (el pago sigue siendo simulado y no hay cobro recurrente).
- **Aprobación de solicitudes de ingreso a clubes privados** (la solicitud se guarda; falta la pantalla del administrador).
- Reporte por voz, envío de reportes al municipio y map matching de las trazas.
- Textos legales definitivos (`/legal/*` son de ejemplo).
