# Base de datos de Waylo

PostgreSQL 16 + PostGIS 3.5.3, base `waylo_db`, esquema `waylo`. El diseño completo (diagramas, diccionario de datos,
análisis de normalización 1FN a 4FN por tabla, vistas, índices, permisos y mapa mock → tabla) está en
[`docs/base-de-datos.md`](../docs/base-de-datos.md).

```
db/
  migrations/   001_*.sql ... 016_*.sql   DDL numerado (cada una corre en una transacción)
  seeds/        001_*.sql ... 006_*.sql   DATOS DE DEMOSTRACIÓN derivados de src/mocks
  apply.sh                                Aplica migraciones pendientes (y semillas con --seed)
  verify.sql                              Pruebas SQL (restricciones, vistas, pantallas principales)
  .env.example                            Variables de la parte de base de datos (sin secretos)
```

> Estado: el SQL se revisó con un analizador sintáctico de PostgreSQL, pero **no se probó contra una base real**
> (no hay PostgreSQL 16 con PostGIS en la máquina de desarrollo). La primera ejecución real es en la VM.

## Requisitos previos (los prepara `docs/vm-setup.md`, no las migraciones)

- Roles `waylo_user` (dueño de `waylo_db`, hace DDL) y `waylo_app` (solo DML).
- La extensión `postgis` creada en `waylo_db`.
- Las migraciones corren como `waylo_user`. No crean roles ni extensiones, y nunca tocan `public` ni otras bases
  de la VM (`libreria_db`).

## Aplicar

La URL con la contraseña va en una variable de entorno (no la pegues en el chat ni la guardes en Git). Si la contraseña tiene caracteres especiales (`@`, `/`, `:`, `#`, `%`), escríbelos codificados en la URL (por ejemplo `@` = `%40`):

```bash
read -rs -p "Contraseña de waylo_user: " PGPW && echo
export MIGRATOR_DATABASE_URL="postgresql://waylo_user:${PGPW}@127.0.0.1:5432/waylo_db"; unset PGPW
```

```bash
./db/apply.sh
```

- Registra cada migración en `waylo.schema_migrations` (versión + checksum) dentro de la misma transacción: si una
  falla no queda nada a medias y el script termina con error.
- Es idempotente: volver a correrlo omite lo ya aplicado. Si una migración aplicada se editó, se detiene (las
  migraciones aplicadas no se editan; se agrega una nueva).
- Debe ejecutarlo una sola persona a la vez (no usa bloqueo entre procesos).

## Sembrar datos de demostración

```bash
./db/apply.sh --seed
```

Las semillas son **solo para ver las pantallas con contenido**: salen de `src/mocks`, no incluyen posiciones ni trazas
GPS (`ride_points` queda vacía; la app usa el GPS real de los teléfonos) y no se aplican en producción por defecto.
Son repetibles (`ON CONFLICT DO NOTHING`, ids deterministas) y las cuentas de demostración no tienen contraseña.

## Verificar

```bash
psql -X --dbname="$MIGRATOR_DATABASE_URL" -f db/verify.sql
```

Corre dentro de una transacción con `ROLLBACK` (no deja datos) y requiere haber sembrado. Termina con
`TODAS LAS PRUEBAS PASARON`; si algo falla, se detiene con `PRUEBA FALLIDA: ...`.

## Comprobar a mano

```bash
psql --dbname="$MIGRATOR_DATABASE_URL" -c "SELECT version, aplicada_en FROM waylo.schema_migrations ORDER BY version"
psql --dbname="$MIGRATOR_DATABASE_URL" -c "SELECT count(*) AS tablas FROM information_schema.tables WHERE table_schema = 'waylo'"
```

## Revertir en desarrollo

No hay migraciones "hacia abajo". En desarrollo, para empezar de cero **solo el esquema de Waylo**:

```bash
psql --dbname="$MIGRATOR_DATABASE_URL" -c "DROP SCHEMA waylo CASCADE"
./db/apply.sh --seed
```

`DROP SCHEMA waylo CASCADE` solo borra objetos del esquema `waylo` (no toca `public`, `libreria_db` ni los roles).
Si una migración falla, su transacción se revierte sola; corrige el archivo (aún sin aplicar) y vuelve a correr
`./db/apply.sh`. Para quitar solo los datos de demostración sin tocar la estructura, usa `DROP SCHEMA` y reaplica
sin `--seed`.

## Conectar la aplicación

Next.js y Flask usan `DATABASE_URL` con el rol `waylo_app` (ver `db/.env.example`). Como las tablas están en el esquema
`waylo`, la conexión debe fijar `search_path=waylo,public` (opción de conexión) o calificar las tablas. `waylo_app`
no puede crear ni alterar objetos.

Si se agrega una vista en una migración nueva, se repite al final el bloque que revoca `INSERT/UPDATE/DELETE`
de `waylo_app` sobre vistas (ver el final de `016_logros_y_funciones.sql`).
