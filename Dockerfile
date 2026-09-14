# ---- Etapa 1: build de Vite ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Etapa 2: servir estáticos con Nginx ----
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/entrypoint.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh

# Se pasa en tiempo de ejecución (docker run -e VITE_AUTH_API_URL=...).
# El entrypoint la escribe en /env.js, que index.html carga antes de la app.
ENV VITE_AUTH_API_URL=""
ENV VITE_STORAGE_URL=""

EXPOSE 80
