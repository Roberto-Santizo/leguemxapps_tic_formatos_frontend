# Guía rápida: que las firmas funcionen al lanzar en Ubuntu

Esta guía es solo para el momento en que el backend (Laravel) se instale en
el servidor Ubuntu real. El frontend **no necesita ningún cambio de código**
para esto -- ya está preparado para apuntar a cualquier dirección del
backend. Lo que hay que revisar es la configuración del propio servidor.

## 1. El backend (Laravel, en el servidor Ubuntu)

**a) `APP_URL` en el `.env` del backend debe apuntar a la IP/dominio real
del servidor**, no a `localhost` ni a `127.0.0.1`. Ejemplo:

```
APP_URL=http://192.168.10.209:8000
```

Laravel usa este valor para armar el link de cada firma
(`Storage::disk('public')->url(...)`). Si queda en `localhost`, el link que
regresa la API funcionará en el propio servidor pero no en ninguna otra
computadora de la red.

**b) Crear el enlace público de archivos (una sola vez, por servidor):**

```bash
php artisan storage:link
```

Este comando crea un acceso directo (symlink) de `public/storage` hacia
`storage/app/public`, que es donde Laravel guarda las firmas
(`storage/app/public/signatures/...`). **Sin este paso, las firmas se
guardan bien pero no se pueden ver** -- el navegador muestra el ícono de
imagen rota. Es el error más común al mover un proyecto Laravel a un
servidor nuevo.

**c) Permisos de la carpeta `storage/`:**

El usuario con el que corre el servidor web (`www-data` en la instalación
típica de Ubuntu + Nginx/Apache) necesita permiso de escritura sobre
`storage/` y `bootstrap/cache/`:

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

Si esto queda mal, las firmas fallan al subirse con un error 400 o 500 (no
es un problema del frontend).

## 2. El frontend (este proyecto)

Solo hay que apuntar el `.env` de este proyecto a la IP real del backend en
Ubuntu, igual que ya se hace hoy con `192.168.10.209`:

```
VITE_AUTH_API_URL=http://<ip-del-servidor-ubuntu>:8000/api
```

`VITE_STORAGE_URL` se puede dejar sin definir -- por defecto el sistema
arma el link de cada firma quitándole el `/api` final a
`VITE_AUTH_API_URL`, que es exactamente como Laravel lo sirve. Solo hay que
definir `VITE_STORAGE_URL` a mano si en el futuro los archivos se sirven
desde un dominio o puerto distinto al de la API.

## 3. Cómo comprobar que quedó bien (checklist de 2 minutos)

1. Crear una Entrega de prueba con firma desde el sistema.
2. Abrir el detalle de esa entrega en Historial -- la firma debe verse ahí.
3. Si NO se ve: copiar la ruta que trae la respuesta de la API (ej.
   `signatures/9f8a1c2e....png`), pegarla después de `/storage/` en la URL
   del servidor y abrirla directo en el navegador:
   `http://<ip-del-servidor-ubuntu>:8000/storage/signatures/9f8a1c2e....png`
   - Si tampoco carga así → falta el paso 1b (`storage:link`) o el 1c
     (permisos).
   - Si carga así pero no dentro del sistema → revisar que `APP_URL` (1a) o
     `VITE_AUTH_API_URL` (2) tengan la IP correcta, no `localhost`.
