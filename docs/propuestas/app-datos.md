# Propuestas de la sesión C (app con datos reales)

Cambios o decisiones que la sesión C **no** pudo resolver dentro de `src/**` y que necesitan a la sesión principal (esquema, contrato, despliegue). Ordenadas por importancia.

## 1. Despliegue (sesión D / principal)

- `NEXT_PUBLIC_WS_URL` y `NEXT_PUBLIC_MAPTILER_KEY` se **incrustan al compilar**: deben estar en el entorno cuando `deploy.sh` corre `next build`, no solo cuando arranca el servicio.
- Variables nuevas para `/etc/waylo/waylo.env`: `SESSION_SECRET` (32+), `WS_JWT_SECRET` (el mismo del servicio en tiempo real), `UPLOADS_DIR`, `APP_URL` (opcional).
- `UPLOADS_DIR` debe existir fuera del repositorio, con escritura para el usuario del servicio web (fotos de reportes, máx. 5 MB). Agregar `uploads/` a `.gitignore` por si se usa el valor por omisión en desarrollo. Si Apache limita el cuerpo de las peticiones, permitir ≥ 6 MB en `/api/reportes/*/foto`.
- La app confía en `x-forwarded-for` / `x-forwarded-host` de Apache para los límites de intentos y la verificación de origen: Apache debe sobrescribirlos (no reenviar los del cliente) y pasar `Host`.

## 2. Motor de rutas (contrato / producto)

Hoy `ruta_consulta` / `ruta_opcion` solo contienen lo ya calculado (semillas de demostración). La app sirve la consulta más reciente hacia el lugar elegido (`src/server/rutas.ts: opcionesHacia`) y, si no hay, dice "Aún no tenemos rutas para este destino".
Falta decidir el proveedor (OpenRouteService, Valhalla, OSRM) y quién escribe esas filas: propongo una función `calcularRutas(origen, destino)` en `src/server/rutas.ts` que consulte al proveedor, inserte la consulta con sus 3 opciones y factores, y que el servidor la invoque al elegir destino. También permite recalcular al desviarse (hoy solo se avisa que te desviaste).

## 3. Safety Score de una rodada libre

`v_rodada_resumen.safety_score` es NULL en rodadas libres. Mientras no se defina en la base, la app lo **estima** (`scoreFromTrack` en `src/lib/map/risk.ts`): `100 − 70 × riesgo promedio` de los reportes de los últimos 90 días cerca de la traza, acotado a 40–97. Propongo llevar esta fórmula a una vista (`v_rodada_score_libre`) para que historial, ranking y perfiles usen el mismo cálculo; hoy `Person.stats.avgSafetyScore` y los retos solo promedian las rodadas con ruta guiada.

## 4. Tiempo real

- El servicio exige `ride_id` de una rodada en curso, así que **"Compartir ubicación en vivo" fuera de una rodada no transmite nada** (la pantalla ya lo dice: "mientras grabas una rodada"). Si se quiere compartir sin grabar, propongo permitir `position` sin `ride_id` cuando el usuario del token tenga una `comparticion_ubicacion` activa, o crear una rodada "de acompañamiento".
- Sigue pendiente de la sesión B (ver `docs/pendientes-integracion.md`): validar `ride_id` contra la base y el `PostgresPositionStore`. Sin eso el historial (`ride_points`) queda vacío y km/minutos de una rodada salen de la ruta guiada o de nada.
- El cliente envía `ts` en ISO 8601 con `Z`, `heading` entero 0–359, `speed` km/h con un decimal y `accuracy` en metros.

## 5. Esquema (sesión A)

- `reporte.colonia_id` nunca se llena: no hay polígonos de colonias ni geocodificación inversa. Propongo una tabla `colonia_area` o un proveedor de geocodificación.
- Notificaciones: nadie las genera todavía para `alerta` (reporte cerca de tu ruta), `reporte` (cambio de estado, lo hace el municipio) ni recordatorios de rodadas grupales. Se necesita un proceso programado o disparadores en la base. La app sí crea las de amistad e invitación a rodada.
- `club_solicitud_ingreso`: la app guarda la solicitud; falta la pantalla del propietario/administrador para aceptar o rechazar.
- Límite de intentos persistente: hoy es en memoria. Con más de una instancia de Next.js habría que moverlo a una tabla (`intento_acceso(clave, creado_en)`).
- Recibos de Premium: no hay cobro recurrente; `suscripcion.vigente_hasta` simplemente vence.
- `mapa_descargado` registra la elección; descargar mosaicos para uso sin conexión requiere definir el formato (PMTiles) y dónde se sirven.

## 6. Producto / seguridad

- **Aviso a contactos de emergencia**: sin proveedor de SMS/WhatsApp, la app registra el evento (`evento_emergencia`) y abre la app de mensajes de la persona con el texto y su ubicación; no hay aviso automático (una web no puede enviar SMS). Un proveedor permitiría avisar sola tras la cuenta regresiva de la caída.
- **Correo**: verificación y recuperación listas detrás de `Mailer`, sin proveedor. Hasta contratarlo nadie recibe el código (en desarrollo se imprime en el log del servidor). Recomiendo Resend o Amazon SES.
- Se **quitaron** de la interfaz: los botones "Continuar con Google/Apple" (no hay proveedor y permitían entrar sin credenciales), el selector de unidades km/mi (sin columna en el esquema) y la edad en el perfil (`User.age` no se guarda). La detección de caídas usa el acelerómetro (golpe > 3 g seguido de ~2 s de quietud) y solo abre la cuenta regresiva; hay que probarla en teléfonos reales y ajustar los umbrales.
