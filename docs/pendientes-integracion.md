# Pendientes de integración entre sesiones

Lista viva que mantiene la sesión principal. Cada punto indica quién lo resuelve y cuándo.

## Tras integrar la sesión A (base de datos)

| # | Pendiente | Responsable |
|---|---|---|
| 1 | **Validar la rodada en el servicio en tiempo real.** Hoy `ride_id` solo se valida como texto. Debe aceptarse un `position` solo si la rodada pertenece al usuario del token y está en curso (`finalizada_en IS NULL`), con caché corta; si no, error `ride_invalida` (ver contrato). Debe **fallar cerrado** cuando haya `DATABASE_URL`. | B (seguimiento) |
| 2 | Implementar `PostgresPositionStore` con `psycopg` 3 contra `ride_points` (`ride_id`, `geog`, `speed`, `heading`, `accuracy`, `ts`; sin `user_id`). Hoy `build_store` devuelve `NullStore`: el historial no se guarda. | B (seguimiento) |
| 3 | **Escribir el lote fuera del candado del hub.** Hoy `BatchWriter.flush` corre dentro de `Hub._lock`; con Postgres lento bloquearía a todos los clientes. Usar una cola y un hilo escritor. | B (seguimiento) |
| 5 | La vista de comparticiones activas (`allow` del token) para que `POST /api/ws-token` arme la lista de usuarios visibles. | C |

## Decisiones tomadas

- **Compartir ubicación sin rodada:** `ride_points` exige `ride_id`. La app crea una rodada ligera ("Ubicación compartida") para sostener el flujo; no se cambia el esquema ni el contrato. El servicio nunca crea rodadas.
- Los puntos 1 a 3 de la tabla de arriba pasan a la sesión B2 (`docs/prompts/sesion-b2-persistencia.md`).
- El punto 5 (vista de comparticiones activas) ya existe: `v_comparticion_activa`.

## Mejoras de despliegue (no bloquean)

- `next build` sobrescribe `.next` mientras la app corre: compilar en otra carpeta y cambiar al terminar.
- `npm ci` borra `node_modules` con la app en marcha: valorar `npm ci` en una copia o ventana de mantenimiento.
- Capacidad del tiempo real: un worker con 50 hilos (`gthread`) limita a unas 50 conexiones simultáneas. Subir `--threads` o pasar a `gevent` si hace falta.
- Agregar `Environment=NODE_ENV=production` a `waylo-web.service`.
- HSTS está en 1 semana (nombre provisional `sslip.io`): subirlo cuando haya dominio definitivo.

## Resuelto

- `deploy.sh` carga `MIGRATOR_DATABASE_URL` desde `/etc/waylo/migrator.env` (permisos 600), separado de `waylo.env`: la app no tiene permisos de DDL.
- El token JWT viaja en la URL del WebSocket: la ruta `/ws` no se registra en el log de accesos de Apache (`SetEnvIf` y `env=!waylo_nolog`).
- Apache (no Nginx) es el servidor que ya corre en la VM: la configuración de proxy vive en `deploy/httpd/`.

## Pendientes de producto (de la sesión C; detalle en `docs/propuestas/app-datos.md`)

| Tema | Estado | Qué falta |
|---|---|---|
| Correo (verificación y recuperar contraseña) | Sin proveedor | Contratar uno (Resend, Amazon SES u otro) e implementar `Mailer`. Hoy nadie recibe códigos y la recuperación de contraseña no es operativa. El registro y el inicio de sesión funcionan sin verificar el correo. |
| Motor de rutas | Solo semillas de demostración | Elegir proveedor (OpenRouteService, Valhalla, OSRM) y que `calcularRutas` escriba `ruta_consulta`/`ruta_opcion`. Recalcular al desviarse. |
| Safety Score de rodada libre | Estimado en la app | Llevar la fórmula a una vista (`v_rodada_score_libre`). |
| Compartir ubicación sin rodada | Solo mientras se graba una rodada | Rodada ligera "Ubicación compartida" creada por la app. |
| Notificaciones de alerta, estado de reporte y recordatorios | Las genera nadie | Proceso programado o disparadores. |
| `reporte.colonia_id` | Siempre vacío | Polígonos de colonias o geocodificación inversa. |
| Aprobar solicitudes de ingreso a un club | Sin pantalla | Pantalla del propietario. |
| Aviso automático a contactos de emergencia | Abre la app de mensajes | Proveedor de SMS o WhatsApp. |
| Mapas sin conexión | Solo registra la elección | Formato (PMTiles) y dónde se sirven. |
| Cobro recurrente de Premium | Pago simulado | Pasarela de pagos. |
| Límite de intentos | En memoria | Moverlo a una tabla si hay más de una instancia. |
