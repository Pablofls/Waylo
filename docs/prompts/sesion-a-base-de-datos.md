# Sesión A: Diseño e implementación de la base de datos de Waylo

## Cómo abrir esta sesión

> Esta sesión ya se completó y se integró a `main`. Si hubiera que repetirla, usa un nombre de rama nuevo (por ejemplo `db-esquema-2`).

1. En tu Mac, crea una carpeta de trabajo propia (un `git worktree`) desde `main`:

```bash
cd ~/Claude/Waylo-main && git fetch origin && git worktree add ../Waylo-db -b db-esquema origin/main
```

2. Después abre una sesión nueva apuntando a esa carpeta (`Waylo-db`) y escribe:

```text
Analiza la aplicación y ejecuta docs/prompts/sesion-a-base-de-datos.md
```

## Rol y reglas generales

**Rama:** `db-esquema`. Antes de empezar lee y cumple `docs/prompts/reglas-comunes.md`: crea tu rama desde `main`, nunca hagas push ni merge a `main`, trabaja solo en `db/**` y `docs/base-de-datos.md`. La sesión principal revisa e integra tu rama.

Eres el responsable del diseño de la base de datos de Waylo. Responde y documenta en **español de México**. Explícame las decisiones importantes en lenguaje claro, porque este es un proyecto universitario y necesito poder defenderlas.

- **No modifiques `src/`** (la web) ni `docs/arquitectura.md`. Si necesitas cambiar el contrato, escríbelo en `docs/propuestas/db-esquema.md`.
- No pongas secretos ni contraseñas en Git. Solo archivos `.env.example`.
- La base de datos vive en una VM de Google Cloud compartida con otro proyecto (`libreria_db`). **Nunca toques objetos de otros proyectos.** El usuario corre los comandos en la VM; tú entregas los comandos exactos.
- Antes de escribir SQL, **presenta un plan breve** (lista de tablas agrupadas por dominio y decisiones clave) y espera mi aprobación.

## Requisito principal: normalización hasta la cuarta forma normal (4FN)

**Todo el esquema debe estar normalizado hasta 4FN. Es el requisito más importante.** Eso implica:

- **1FN:** valores atómicos. Sin arreglos, listas separadas por comas ni JSON para guardar hechos que se consultan o se relacionan (por ejemplo: asistentes, reglas, miembros, insignias, categorías). Sin grupos repetidos (`telefono1`, `telefono2`).
- **2FN y 3FN:** ningún atributo no clave depende solo de parte de la clave ni de otro atributo no clave. Ejemplos a vigilar: calle, colonia, municipio; plan y precio; categoría de reporte y su etiqueta o ícono; nivel de rodada.
- **FNBC (BCNF):** todo determinante es llave candidata.
- **4FN:** ninguna dependencia multivaluada no trivial. Si una entidad tiene dos o más hechos multivaluados **independientes entre sí**, cada uno va en su propia tabla. Ejemplos a vigilar: los vehículos de una persona, sus preferencias de ruta a evitar, sus preferencias de notificación y sus contactos de emergencia **nunca** deben combinarse en una sola tabla de producto cruzado; igual con las reglas de una rodada y sus asistentes, o los miembros y las rodadas de un club.

Reglas prácticas que debes aplicar:

1. **Catálogos en tablas, no en cadenas repetidas.** Categorías de reporte, estados de reporte, niveles, ritmos, tipos de vehículo, tipos de notificación, factores del Safety Score, planes y tipos de insignia son tablas de catálogo con llave y clave referenciadas por FK (o `CHECK`/enumerados solo cuando el conjunto es cerrado y no tiene atributos propios; justifica cada caso).
2. **No guardes datos derivados.** Conteos de confirmaciones, asistentes, reacciones, notificaciones sin leer, amigos en común, estadísticas del mes, Score promedio de una rodada y progreso de retos se calculan con consultas o **vistas** (`CREATE VIEW`). Si por rendimiento propones una vista materializada, justifícalo y documenta cómo se refresca.
3. **Relaciones simétricas se guardan una sola vez** (amistad: `CHECK (usuario_a < usuario_b)` más llave única), con la solicitud y el estado modelados sin duplicar filas.
4. **Referencias polimórficas:** evita columnas `tipo` + `id` sin FK. Usa tablas separadas o varias FK nulas con `CHECK` de exactamente una.
5. **Direcciones:** modela la jerarquía geográfica (municipio, colonia, calle o lugar) sin repetir texto y sin dependencias transitivas.
6. Cada tabla debe tener llave primaria, FK con política de borrado explícita, `NOT NULL` donde corresponda, `CHECK` de rangos (por ejemplo Safety Score 0 a 100, latitud y longitud) y llaves únicas naturales.

**Entregable de normalización:** en `docs/base-de-datos.md`, para **cada tabla** incluye: llaves candidatas, dependencias funcionales, dependencias multivaluadas (o la afirmación razonada de que no hay) y por qué cumple 1FN, 2FN, 3FN, FNBC y 4FN. Documenta también las **decisiones de desnormalización**, si las hubiera, aunque lo esperado es **ninguna**.

## Análisis previo de la aplicación (obligatorio)

Lee y analiza, antes de diseñar:

1. `docs/arquitectura.md`, `docs/vm-setup.md` y `docs/pantallas.md`.
2. `src/types/index.ts` y **todos** los archivos de `src/mocks/`: muestran todos los datos que maneja la app.
3. `src/lib/social.tsx` (estado en memoria de amigos, rodadas, reportes, lugares, clubes, retos, suscripción, etc.) y `src/lib/data/index.ts`.
4. Las pantallas en `src/app` y `src/components/screens` (empieza por `/catalogo`, `src/app/catalogo/page.tsx`) para entender qué ve y hace el usuario.
5. `src/lib/safety.ts`, `src/lib/map/risk.ts` y `src/lib/report-categories.ts`, que definen reglas del Safety Score y de las categorías.

Los mocks están **desnormalizados a propósito para la interfaz** (por ejemplo `Person.stats`, `Person.mutual`, `Person.relation`, `Report.confirmations`, `GroupRide.attendeeIds`). **No copies esa estructura al esquema:** extrae las entidades y relaciones reales y normalízalas.

## Dominios que debe cubrir el esquema

Revisa que no falte nada del análisis. Como mínimo:

- **Cuenta:** usuarios, credenciales (hash), sesiones, verificación de correo, recuperación de contraseña, perfil, vehículos del usuario, preferencias de ruta (rápida o segura, minutos extra, qué evitar, qué preferir), preferencias de notificación y horario silencioso, privacidad, usuarios bloqueados.
- **Geografía y lugares:** municipios y colonias del AMM, lugares guardados del usuario, historial de búsquedas, rutas guardadas.
- **Rutas y Safety Score:** opciones de ruta calculadas, factores del Safety Score (catálogo de 5 factores) con su calificación por ruta y explicación, tramos.
- **Rodadas individuales:** rodadas, puntos de traza (`ride_points`, con geografía PostGIS, velocidad, rumbo, precisión y marca de tiempo; contrato en `docs/arquitectura.md`), estado, pausas, nombre editable, borrado.
- **Tiempo real:** comparticiones de ubicación en vivo (con quién, duración, estado) y la tabla de historial que escribirá el servicio Flask.
- **Reportes:** reportes con categoría, ubicación, gravedad, nota, foto, estado e historial de estados (línea de tiempo), confirmaciones de otros usuarios ("sigue ahí" o "ya no está"), cancelación, pendientes por completar, denuncias de contenido.
- **Social:** amistades y solicitudes, actividad, reacciones y comentarios sobre rodadas, notificaciones (alerta, reporte, amistad, rodada) con estado leído.
- **Rodadas grupales:** rodadas grupales, punto de salida, nivel, ritmo, vehículo, privacidad, cupo, reglas o recomendaciones (catálogo y relación), asistentes, invitaciones, estado.
- **Clubes:** clubes, miembros (con rol), solicitudes de ingreso a clubes privados, rodadas del club.
- **Retos e insignias:** retos mensuales, participación y progreso, catálogo de insignias, insignias obtenidas.
- **Seguridad personal:** contactos de emergencia, configuración de detección de caídas, eventos de emergencia o caída.
- **Premium y pagos:** planes, suscripciones (estados: activa, cancelada con vigencia), pagos y recibos (folio, método, impuestos), zonas y su historial de seguridad por mes, mapas descargados.
- **Ayuda:** comentarios y mensajes de soporte, preguntas frecuentes (si se almacenan).

## Requisitos técnicos

- PostgreSQL 16 con **PostGIS 3.5.3** (ya instalado en la VM). Usa `geography(Point, 4326)` y `geography(LineString, 4326)` donde corresponda, con índices GiST.
- Ids `uuid` (`gen_random_uuid()`), fechas `timestamptz`, textos en español de México. Nombres de tablas y columnas en español, en minúsculas con guion bajo, consistentes.
- Base `waylo_db`; dueño `waylo_user` (migraciones y DDL); rol de la app `waylo_app` (solo `SELECT/INSERT/UPDATE/DELETE` sobre tablas, `USAGE` en secuencias y esquema; **sin DDL**). Usa un esquema propio (por ejemplo `waylo`) y no uses `public`.
- Migraciones SQL numeradas en `db/migrations` (`001_*.sql`, `002_*.sql`...), **idempotentes** o controladas por una tabla `schema_migrations`, y ordenadas por dependencias.
- Índices para las consultas de la app (por usuario, por fecha, espaciales, por estado) y justificación de los más importantes.
- Triggers solo cuando sean necesarios (por ejemplo `updated_at`), documentados.
- Zona horaria: almacenar en UTC (`timestamptz`) y presentar en `America/Monterrey`.

## Entregables

1. `docs/base-de-datos.md`:
   - Resumen del diseño y decisiones importantes.
   - **Diagrama entidad-relación en Mermaid** (puede dividirse por dominio).
   - **Diccionario de datos** (tabla, columna, tipo, restricciones, descripción).
   - **Sección de normalización a 4FN por tabla** (ver arriba).
   - Vistas para datos derivados y qué pantalla las usa.
   - Índices y su justificación.
   - Permisos por rol.
   - Mapa "mock a tabla": cómo cada campo de `src/types` y `src/mocks` se obtiene del esquema.
2. `db/migrations/*.sql`: migraciones numeradas.
3. `db/seeds/*.sql`: datos de demostración **derivados de los mocks** (Daniela Garza y su ruta casa a la UDEM, amigos, rodadas grupales, reportes, clubes, retos, insignias, zonas), insertados sin romper las restricciones y reproducibles. Son solo para ver las pantallas con contenido: se aplican únicamente con `--seed`, **no incluyas posiciones ni trazas simuladas "en vivo"** y márcalos claramente como datos de demostración. La app usará el GPS real de los teléfonos, no vehículos simulados.
4. `db/apply.sh`: aplica migraciones pendientes en orden, registra cada una en `schema_migrations`, es idempotente y usa variables de entorno (`MIGRATOR_DATABASE_URL`; opcional `--seed`). Debe fallar de forma clara y no dejar la base a medias (cada migración en una transacción).
5. `db/verify.sql` o `db/tests/*.sql`: **pruebas SQL** que verifiquen restricciones (`CHECK`, `UNIQUE`, FK), que las vistas devuelven lo esperado con los datos de ejemplo y que no existen columnas con arreglos o JSON para hechos multivaluados. Incluye consultas que reproducen lo que muestran las pantallas principales (Inicio, perfil de persona, rodadas grupales, reportes cercanos).
6. `db/README.md` con el flujo: cómo aplicar, sembrar, verificar y revertir en desarrollo.
7. `db/.env.example` (solo la parte de base de datos) sin secretos.

## Proceso esperado

1. Análisis de la app (resume lo encontrado: entidades, relaciones y reglas).
2. **Plan** de tablas por dominio con las decisiones de normalización clave. **Espera mi aprobación.**
3. Implementación por dominios, con un commit por dominio.
4. Pruebas en una base local si hay Postgres disponible; si no, revisa el SQL con cuidado y dímelo claramente.
5. Revisión final contra la lista de verificación de abajo.
6. Entrega: rama `db-esquema` subida y **lista de comandos exactos para correr en la VM**, en orden, así:
   - `cd ~/Waylo && git fetch && git checkout db-esquema && git pull`
   - Variables de entorno necesarias (sin pedirme que las pegue en el chat).
   - `./db/apply.sh --seed`, luego `psql ... -f db/verify.sql`.
   - Cómo comprobar el resultado y cómo revertir si algo sale mal.

## Lista de verificación (no des por terminada la sesión sin cumplirla)

- [ ] Cada tabla está documentada con su análisis de 1FN a 4FN, y no hay arreglos ni JSON para hechos multivaluados.
- [ ] No hay datos derivados almacenados (conteos, promedios, "mutual", estadísticas) sin justificación explícita.
- [ ] Hechos multivaluados independientes están en tablas separadas (no producto cruzado).
- [ ] Todo catálogo es tabla o `CHECK` justificado; ninguna cadena repetida que dependa de otra.
- [ ] La amistad y otras relaciones simétricas se guardan una sola vez.
- [ ] `ride_points` cumple el contrato de `docs/arquitectura.md` (usuario, rodada, geografía, velocidad, rumbo, precisión, `ts`).
- [ ] `waylo_app` no tiene permisos de DDL ni toca objetos de otros proyectos.
- [ ] `db/apply.sh` es idempotente y cada migración corre en transacción.
- [ ] Los datos de ejemplo corresponden a los mocks y las pruebas SQL pasan.
- [ ] La rama `db-esquema` está subida, actualizada con `origin/main`, y los comandos de la VM son exactos y en orden.
