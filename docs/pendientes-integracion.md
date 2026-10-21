# Pendientes de integración entre sesiones

Lista viva que mantiene la sesión principal. Cada punto indica quién lo resuelve y cuándo.

## Tras integrar la sesión A (base de datos)

| # | Pendiente | Responsable |
|---|---|---|
| 1 | **Validar la rodada en el servicio en tiempo real.** Hoy `ride_id` solo se valida como texto. Debe aceptarse un `position` solo si la rodada pertenece al usuario del token y está en curso (`finalizada_en IS NULL`), con caché corta; si no, error `ride_invalida` (ver contrato). Debe **fallar cerrado** cuando haya `DATABASE_URL`. | B (seguimiento) |
| 2 | Implementar `PostgresPositionStore` con `psycopg` 3 contra `ride_points` (`ride_id`, `geog`, `speed`, `heading`, `accuracy`, `ts`; sin `user_id`). Hoy `build_store` devuelve `NullStore`: el historial no se guarda. | B (seguimiento) |
| 3 | **Escribir el lote fuera del candado del hub.** Hoy `BatchWriter.flush` corre dentro de `Hub._lock`; con Postgres lento bloquearía a todos los clientes. Usar una cola y un hilo escritor. | B (seguimiento) |
| 5 | La vista de comparticiones activas (`allow` del token) para que `POST /api/ws-token` arme la lista de usuarios visibles. | C |

## Mejoras de despliegue (no bloquean)

- `next build` sobrescribe `.next` mientras la app corre: compilar en otra carpeta y cambiar al terminar.
- `npm ci` borra `node_modules` con la app en marcha: valorar `npm ci` en una copia o ventana de mantenimiento.
- Capacidad del tiempo real: un worker con 50 hilos (`gthread`) limita a unas 50 conexiones simultáneas. Subir `--threads` o pasar a `gevent` si hace falta.
- Agregar `Environment=NODE_ENV=production` a `waylo-web.service`.
- La cabecera HSTS de un año está sobre un nombre provisional (`sslip.io`): reducirla mientras no haya dominio definitivo.

## Resuelto

- `deploy.sh` carga `MIGRATOR_DATABASE_URL` desde `/etc/waylo/migrator.env` (permisos 600), separado de `waylo.env`: la app no tiene permisos de DDL.
- El token JWT viaja en la URL del WebSocket: `access_log off` en `/ws` para que no quede en los logs de Nginx.
