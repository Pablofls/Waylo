#!/usr/bin/env bash
# Aplica las migraciones pendientes de db/migrations en orden y, con --seed, los datos de demostración.
#
#   MIGRATOR_DATABASE_URL=postgresql://waylo_user:...@127.0.0.1:5432/waylo_db ./db/apply.sh [--seed]
#
# - Cada migración corre en UNA transacción junto con su registro en waylo.schema_migrations:
#   si falla, no queda nada a medias y el script termina con código distinto de cero.
# - Es idempotente: las migraciones ya registradas se omiten; si una ya aplicada cambió, se detiene.
# - No imprime la URL ni la contraseña.
set -euo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED=0

uso() {
  echo "Uso: MIGRATOR_DATABASE_URL=... $0 [--seed]"
  echo "  --seed   además aplica db/seeds/*.sql (DATOS DE DEMOSTRACIÓN, no usar en producción)"
}

for arg in "$@"; do
  case "$arg" in
    --seed) SEED=1 ;;
    -h|--help) uso; exit 0 ;;
    *) echo "Opción desconocida: $arg" >&2; uso >&2; exit 2 ;;
  esac
done

fallo() { echo "ERROR: $*" >&2; exit 1; }

[ -n "${MIGRATOR_DATABASE_URL:-}" ] || fallo "Falta la variable MIGRATOR_DATABASE_URL (rol waylo_user). Ver db/.env.example."
command -v psql >/dev/null 2>&1 || fallo "No se encontró psql en el PATH."

if command -v sha256sum >/dev/null 2>&1; then
  suma() { sha256sum "$1" | cut -d' ' -f1; }
else
  suma() { shasum -a 256 "$1" | cut -d' ' -f1; }
fi

PSQL=(psql "$MIGRATOR_DATABASE_URL" -X -q -v ON_ERROR_STOP=1)

# Requisitos previos que NO crean las migraciones (los prepara docs/vm-setup.md).
[ "$("${PSQL[@]}" -tA -c "SELECT count(*) FROM pg_extension WHERE extname = 'postgis'")" = "1" ] \
  || fallo "La extensión postgis no está creada en esta base (ver docs/vm-setup.md, paso 2)."
[ "$("${PSQL[@]}" -tA -c "SELECT count(*) FROM pg_roles WHERE rolname IN ('waylo_user', 'waylo_app')")" = "2" ] \
  || fallo "Faltan los roles waylo_user y/o waylo_app (ver docs/vm-setup.md, paso 2)."

# Registro de migraciones (la tabla vive en el esquema waylo).
"${PSQL[@]}" -c "
  CREATE SCHEMA IF NOT EXISTS waylo;
  CREATE TABLE IF NOT EXISTS waylo.schema_migrations (
    version     text PRIMARY KEY,
    checksum    text NOT NULL,
    aplicada_en timestamptz NOT NULL DEFAULT now()
  );"

aplicadas=0
omitidas=0
shopt -s nullglob
for archivo in "$AQUI"/migrations/[0-9][0-9][0-9]_*.sql; do
  version="$(basename "$archivo")"
  checksum="$(suma "$archivo")"
  previo="$("${PSQL[@]}" -tA -c "SELECT checksum FROM waylo.schema_migrations WHERE version = '$version'")"
  if [ -n "$previo" ]; then
    [ "$previo" = "$checksum" ] || fallo "La migración $version ya estaba aplicada pero su contenido cambió. No se editan migraciones aplicadas: crea una nueva."
    omitidas=$((omitidas + 1))
    continue
  fi
  echo "Aplicando $version ..."
  if ! "${PSQL[@]}" --single-transaction -f "$archivo" \
       -c "INSERT INTO waylo.schema_migrations (version, checksum) VALUES ('$version', '$checksum')"; then
    fallo "Falló $version. Se revirtió su transacción; las migraciones anteriores siguen aplicadas."
  fi
  aplicadas=$((aplicadas + 1))
done
echo "Migraciones: $aplicadas aplicadas, $omitidas ya estaban aplicadas."

if [ "$SEED" = "1" ]; then
  echo "AVISO: sembrando DATOS DE DEMOSTRACIÓN (db/seeds)."
  for archivo in "$AQUI"/seeds/[0-9][0-9][0-9]_*.sql; do
    echo "Sembrando $(basename "$archivo") ..."
    "${PSQL[@]}" --single-transaction -f "$archivo" \
      || fallo "Falló el sembrado $(basename "$archivo"). Se revirtió su transacción."
  done
  echo "Datos de demostración listos."
fi
echo "Listo."
