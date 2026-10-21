# Sesión C: App con datos reales

## Cómo abrir esta sesión

1. En tu Mac, crea una carpeta de trabajo propia (un `git worktree`) desde `main`:

```bash
cd ~/Claude/Waylo-main && git fetch origin && git worktree add ../Waylo-app-datos -b app-datos origin/main
```

2. Después abre una sesión nueva apuntando a esa carpeta (`Waylo-app-datos`) y escribe:

```text
Ejecuta docs/prompts/sesion-c-app-datos.md
```

**Rama:** `app-datos`. Antes de empezar lee y cumple `docs/prompts/reglas-comunes.md` (crea tu rama desde `main`, no toques `main`, trabaja solo en `src/**`, `package.json`, `package-lock.json` y `README.md`).

## Condición para empezar
Esta sesión depende de A y B. Verifica en `origin/main` que existen `db/migrations`, `docs/base-de-datos.md` y `services/realtime`. **Si falta alguno, detente y avísale al usuario** que la sesión principal debe integrar primero A y B.

## Contexto
Lee `docs/arquitectura.md`, `docs/base-de-datos.md`, `services/realtime/README.md`, `src/lib/data/index.ts`, `src/lib/social.tsx` y las pantallas en `src/app` y `src/components/screens`. Hoy toda la app corre con datos de ejemplo (`src/mocks`) y estado en memoria. Hay que conectarla a Postgres y al servicio de tiempo real **sin cambiar la interfaz** salvo lo indicado.

## Alcance
1. **Acceso a datos:** reemplaza `src/lib/data` por consultas reales a Postgres con el paquete `pg` (sin ORM pesado), usando `DATABASE_URL` (rol `waylo_app`). Consultas parametrizadas, un módulo por dominio, y las vistas de la base de datos para los datos derivados. Los componentes reciben los mismos tipos que hoy.
2. **Estado de sesión:** sustituye `src/lib/social.tsx` (estado en memoria) por rutas API de Next.js (`src/app/api/**`) y recarga/mutación en cliente; mantén una interfaz de hooks equivalente para no reescribir las pantallas.
3. **Cuenta:** registro, inicio de sesión y cierre de sesión con contraseñas con hash (argon2 o bcrypt), sesiones con cookie `httpOnly`, `secure` y `sameSite`, verificación de correo y recuperación de contraseña (con envío de correo detrás de una interfaz; si no hay proveedor de correo aún, deja la implementación lista y dilo), protección de rutas y límites de intentos.
4. **GPS real y tiempo real:**
   - **Elimina el modo simulación**: el interruptor en Comenzar, `useRide` en modo simulado y las rutas de ejemplo usadas como trayectoria. La rodada usa solo `navigator.geolocation.watchPosition` (alta precisión, descartar precisión > 30 m, Wake Lock). En escritorio sin GPS o con permiso denegado muestra el aviso de `/permisos/ubicacion` y no inicia.
   - `POST /api/ws-token` que emite el JWT corto del contrato (`sub`, `role`, `allow`, `exp`) con `WS_JWT_SECRET`.
   - Cliente WebSocket que publica posiciones (`role=gps`) durante una rodada y, para la ubicación en vivo y el seguimiento, escucha (`role=map`). Reconexión automática y renovación del token.
   - La rodada se **crea al iniciar** (API que devuelve `ride_id`), antes de transmitir; los puntos los guarda el servicio en tiempo real. Al terminar se marca la rodada como finalizada (no se guardan km ni minutos: se calculan).
5. **Migración por áreas**, un commit por área: cuenta, rodadas, reportes, social (amigos, comentarios, reacciones), rodadas grupales y clubes, retos e insignias, notificaciones, lugares y rutas guardadas, Premium (el pago sigue siendo simulado: no integres cobros reales), ayuda.
6. **Pruebas** de las rutas API (autenticación, permisos, validaciones) y de los puntos críticos. `npx tsc --noEmit` y `next build` sin errores.
7. Actualiza `README.md` (cómo correr, variables de entorno) y quita la sección "Pendiente para fase 2" que ya no aplique.

## Qué NO hacer
- No modifiques `db/**`, `services/realtime/**` ni `deploy/**`. Si necesitas un cambio en el esquema o el contrato, descríbelo en `docs/propuestas/app-datos.md` y avisa a la sesión principal.
- No guardes secretos en Git ni expongas datos de otros usuarios que no deban verse (revisa privacidad, bloqueos y amistades en cada consulta).
- No dejes datos de ejemplo ni posiciones simuladas en producción.

## Entrega
1. Rama `app-datos` subida y actualizada con `origin/main`.
2. Resumen por área y lo que quedó pendiente.
3. **Comandos para la VM:** variables de entorno nuevas (sin pedirlas en el chat), `git pull`, `./deploy/deploy.sh` y cómo verificar el flujo completo (registro, rodada con GPS real desde un teléfono por HTTPS, ubicación en vivo).
