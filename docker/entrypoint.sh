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

# /storage/ del mismo servidor -> backend Laravel, para que el PDF pueda
# incrustar las firmas (el navegador no deja capturar imágenes de otro origen
# sin CORS; ver src/pdf/datosPdf.js). Misma base que STORAGE_BASE_URL de
# api.js: VITE_STORAGE_URL o VITE_AUTH_API_URL sin el /api final.
# proxy_pass va con variable para que nginx arranque aunque el backend no
# resuelva todavía (con un nombre fijo, un DNS caído impediría el arranque);
# el resolver es el del contenedor.
BASE="${VITE_STORAGE_URL:-$VITE_AUTH_API_URL}"
BASE="${BASE%/}"
if [ -z "$VITE_STORAGE_URL" ]; then BASE="${BASE%/api}"; fi
NS="$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf 2>/dev/null)"
case "$NS" in *:*) NS="[$NS]" ;; esac
if [ -n "$BASE" ]; then
  cat > /etc/nginx/storage-proxy.conf <<CONF
${NS:+resolver $NS valid=30s;}
location /storage/ {
    set \$backend_storage "${BASE}";
    proxy_pass \$backend_storage\$request_uri;
    proxy_ssl_server_name on;
}
CONF
else
  : > /etc/nginx/storage-proxy.conf
fi
