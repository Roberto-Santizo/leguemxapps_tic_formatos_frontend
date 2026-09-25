#!/bin/sh
# Genera env.js con las variables de entorno del contenedor para que el
# frontend (ya compilado) las lea en runtime vía window.__ENV__.
set -e
cat > /usr/share/nginx/html/env.js <<JS
window.__ENV__ = {
  VITE_AUTH_API_URL: "${VITE_AUTH_API_URL}",
  VITE_STORAGE_URL: "${VITE_STORAGE_URL}"
};
JS

# Firmas desde el MISMO servidor del frontend, para que el PDF pueda
# incrustarlas (el navegador no deja capturar imágenes de otro origen sin
# CORS; ver src/pdf/datosPdf.js):
#  - /storage/      -> backend Laravel. Misma base que STORAGE_BASE_URL de
#                      api.js: VITE_STORAGE_URL o VITE_AUTH_API_URL sin /api.
#  - /firma-remota/ -> firmas guardadas en un bucket de S3
#                      (/firma-remota/<bucket>.amazonaws.com/<ruta>), solo
#                      hosts *.amazonaws.com y solo GET.
# proxy_pass va con variables para que nginx arranque aunque un nombre no
# resuelva (con un nombre fijo, un DNS caído impediría el arranque); el
# resolver es el del contenedor.
BASE="${VITE_STORAGE_URL:-$VITE_AUTH_API_URL}"
BASE="${BASE%/}"
if [ -z "$VITE_STORAGE_URL" ]; then BASE="${BASE%/api}"; fi
NS="$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf 2>/dev/null)"
case "$NS" in *:*) NS="[$NS]" ;; esac
{
  [ -n "$NS" ] && echo "resolver $NS valid=30s;"
  if [ -n "$BASE" ]; then
    cat <<CONF
location /storage/ {
    set \$backend_storage "${BASE}";
    proxy_pass \$backend_storage\$request_uri;
    proxy_ssl_server_name on;
}
CONF
  fi
  cat <<'CONF'
location ~ ^/firma-remota/(?<s3host>[A-Za-z0-9.-]+\.amazonaws\.com)(?<s3path>/.*)$ {
    limit_except GET { deny all; }
    proxy_pass https://$s3host$s3path$is_args$args;
    proxy_set_header Host $s3host;
    proxy_ssl_server_name on;
    proxy_intercept_errors on;
}
CONF
} > /etc/nginx/storage-proxy.conf
