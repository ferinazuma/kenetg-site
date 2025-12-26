#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${BACKEND_ENV_FILE:-/etc/kenetg/backend.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create it from backend/.env.example and try again."
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

required_vars=(
  BACKEND_BIND_HOST
  BACKEND_PORT
  DB_HOST
  DB_PORT
  DB_NAME
  DB_USER
  DB_PASSWORD
  PUBLIC_BASE_URL
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required env var: $var"
    exit 1
  fi
done

BACKEND_APP_ROOT="${BACKEND_APP_ROOT:-/opt/kenetg/backend}"
HEALTH_HOST="$BACKEND_BIND_HOST"

if [[ "$HEALTH_HOST" == "0.0.0.0" ]]; then
  HEALTH_HOST="127.0.0.1"
fi
export HEALTH_HOST

if [[ "$BACKEND_APP_ROOT" == "/" ]]; then
  echo "BACKEND_APP_ROOT cannot be /"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_SRC="$SCRIPT_DIR/../app"
SYSTEMD_TEMPLATE="$SCRIPT_DIR/../systemd/kenetg-backend.service"

if [[ ! -d "$APP_SRC" ]]; then
  echo "Missing app source: $APP_SRC"
  exit 1
fi

if [[ ! -f "$SYSTEMD_TEMPLATE" ]]; then
  echo "Missing systemd template: $SYSTEMD_TEMPLATE"
  exit 1
fi

sudo mkdir -p "$BACKEND_APP_ROOT/app"
sudo cp -a "$APP_SRC/." "$BACKEND_APP_ROOT/app/"

SERVICE_TARGET="/etc/systemd/system/kenetg-backend.service"
sed \
  -e "s|BACKEND_APP_ROOT|$BACKEND_APP_ROOT|g" \
  -e "s|BACKEND_ENV_FILE|$ENV_FILE|g" \
  "$SYSTEMD_TEMPLATE" | sudo tee "$SERVICE_TARGET" >/dev/null

sudo systemctl daemon-reload
sudo systemctl enable --now kenetg-backend.service

if command -v curl >/dev/null 2>&1; then
  curl -fsS "http://${HEALTH_HOST}:${BACKEND_PORT}/api/health" >/dev/null
else
  python3 - <<'PY'
import os
import urllib.request

host = os.environ.get("HEALTH_HOST", os.environ.get("BACKEND_BIND_HOST", "127.0.0.1"))
port = os.environ.get("BACKEND_PORT", "8080")
url = f"http://{host}:{port}/api/health"
with urllib.request.urlopen(url, timeout=5) as response:
    if response.status != 200:
        raise SystemExit("Healthcheck failed")
PY
fi

echo "Backend healthcheck ok."
