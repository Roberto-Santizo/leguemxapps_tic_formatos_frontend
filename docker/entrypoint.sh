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
