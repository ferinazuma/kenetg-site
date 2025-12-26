#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${EDGE_ENV_FILE:-/etc/kenetg/edge.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create it from edge/.env.example and try again."
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

required_vars=(
  EDGE_WEB_ROOT
  EDGE_SERVER_NAME
  EDGE_NGINX_SITE_NAME
  BACKEND_PRIVATE_IP
  BACKEND_PORT
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required env var: $var"
    exit 1
  fi
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_SRC="$SCRIPT_DIR/../web"
NGINX_TEMPLATE="$SCRIPT_DIR/../nginx/kenetg-edge.conf"

if [[ ! -d "$WEB_SRC" ]]; then
  echo "Missing web source: $WEB_SRC"
  exit 1
fi

if [[ ! -f "$NGINX_TEMPLATE" ]]; then
  echo "Missing nginx template: $NGINX_TEMPLATE"
  exit 1
fi

if [[ "$EDGE_WEB_ROOT" == "/" ]]; then
  echo "EDGE_WEB_ROOT cannot be /"
  exit 1
fi

sudo mkdir -p "$EDGE_WEB_ROOT"
sudo cp -a "$WEB_SRC/." "$EDGE_WEB_ROOT/"

sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
TARGET="/etc/nginx/sites-available/${EDGE_NGINX_SITE_NAME}.conf"

sed \
  -e "s|EDGE_SERVER_NAME|$EDGE_SERVER_NAME|g" \
  -e "s|EDGE_WEB_ROOT|$EDGE_WEB_ROOT|g" \
  -e "s|BACKEND_PRIVATE_IP|$BACKEND_PRIVATE_IP|g" \
  -e "s|BACKEND_PORT|$BACKEND_PORT|g" \
  "$NGINX_TEMPLATE" | sudo tee "$TARGET" >/dev/null

if [[ ! -e "/etc/nginx/sites-enabled/${EDGE_NGINX_SITE_NAME}.conf" ]]; then
  sudo ln -s "$TARGET" "/etc/nginx/sites-enabled/${EDGE_NGINX_SITE_NAME}.conf"
fi

sudo nginx -t
echo "Nginx config ok. Reload with: sudo systemctl reload nginx"
