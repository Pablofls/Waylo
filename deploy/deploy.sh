#!/usr/bin/env bash
# Despliegue de Waylo en la VM. Uso: cd ~/Waylo && ./deploy/deploy.sh
# Construye antes de reiniciar: si el build falla, la app actual sigue en pie.
set -euo pipefail

ENV_FILE="${WAYLO_ENV_FILE:-/etc/waylo/waylo.env}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

msg()  { printf '\n==> %s\n' "$*"; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

PREV="$(git rev-parse HEAD)"
trap 'rc=$?; [ $rc -ne 0 ] && printf "\nEl despliegue fallo. Version anterior: %s\nPara revertir: git checkout %s && ./deploy/deploy.sh --sin-pull\n" "$PREV" "$PREV" >&2' EXIT

[ -r "$ENV_FILE" ] || fail "No se puede leer $ENV_FILE (ver docs/vm-setup.md)."
set -a; . "$ENV_FILE"; set +a
: "${WEB_PORT:?Falta WEB_PORT en $ENV_FILE}"

if [ "${1:-}" != "--sin-pull" ]; then
  msg "Actualizando codigo (main)"
  [ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || fail "Estas fuera de main. Usa: git checkout main"
  git pull --ff-only || fail "git pull no pudo avanzar en fast-forward."
fi
echo "Version: $(git rev-parse --short HEAD) (antes: ${PREV:0:7})"

msg "Dependencias de la web (npm ci)"
npm ci || fail "npm ci fallo."

msg "Construyendo la web (next build)"
npm run build || fail "El build fallo; los servicios NO se reiniciaron y siguen con la version anterior."

HAS_RT=0
if [ -d services/realtime ]; then
  HAS_RT=1
  msg "Entorno de Python del servicio en tiempo real"
  [ -d services/realtime/.venv ] || python3.12 -m venv services/realtime/.venv
  services/realtime/.venv/bin/pip install --quiet --upgrade pip
  services/realtime/.venv/bin/pip install -r services/realtime/requirements.txt \
    || fail "pip install fallo."
else
  echo "Aviso: services/realtime no existe todavia; se omite."
fi

if [ -f db/apply.sh ]; then
  msg "Migraciones (db/apply.sh)"
  # Las credenciales de migracion (rol waylo_user, con DDL) viven aparte de waylo.env:
  # el servicio y la web usan waylo_app, que no puede crear ni borrar tablas.
  MIG_ENV="${WAYLO_MIGRATOR_ENV:-/etc/waylo/migrator.env}"
  [ -r "$MIG_ENV" ] || fail "No se puede leer $MIG_ENV (credenciales de migracion; ver docs/vm-setup.md)."
  ( set -a; . "$MIG_ENV"; set +a; bash db/apply.sh ) || fail "db/apply.sh fallo; no se reinicio nada."
else
  echo "Aviso: db/apply.sh no existe todavia; se omite."
fi

msg "Reiniciando servicios"
sudo systemctl restart waylo-web
[ "$HAS_RT" = 1 ] && sudo systemctl restart waylo-realtime

wait_http() { # url, nombre
  for _ in $(seq 1 30); do
    curl -fsS -o /dev/null --max-time 3 "$1" && { echo "OK: $2"; return 0; }
    sleep 2
  done
  return 1
}

msg "Verificando salud"
wait_http "http://127.0.0.1:${WEB_PORT}/" "web (puerto ${WEB_PORT})" \
  || fail "La web no responde. Revisa: journalctl -u waylo-web -n 100 --no-pager"
if [ "$HAS_RT" = 1 ]; then
  wait_http "http://127.0.0.1:${REALTIME_PORT:-5950}/health" "tiempo real (puerto ${REALTIME_PORT:-5950})" \
    || fail "El tiempo real no responde. Revisa: journalctl -u waylo-realtime -n 100 --no-pager"
fi

trap - EXIT
msg "Despliegue completo: $(git rev-parse --short HEAD)"
