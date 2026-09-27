# Guía rápida: que las firmas se vean al lanzar en Ubuntu

Checklist de servidor para que las firmas se vean **en pantalla y en el PDF**. El frontend
no necesita cambios de código: todo es configuración. Actualizada al 2026-09-27 contra el
backend (`legumexapps_tic_formatos_backend`) y el Docker de este repositorio.

## 1. Backend (Laravel)

**a) Dónde se guardan las firmas: `SIGNATURES_DISK`.** El backend guarda cada firma en el
disco `signatures` (`config/filesystems.php`), que **por defecto es S3**. Elegir uno:

- **S3** (`SIGNATURES_DISK=s3`, el valor por defecto): llenar en el `.env` del backend
  `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION` y `AWS_BUCKET` (o
  `AWS_URL`). La API devuelve un link completo `https://<bucket>.s3.<región>.amazonaws.com/...`.
  El servidor del frontend debe poder **salir a internet** hacia `*.amazonaws.com` (ver 2c).
- **Disco local** (`SIGNATURES_DISK=public`): las firmas quedan en
  `storage/app/public/signatures/` y se sirven por `/storage/`. Hace falta:

  ```bash
  php artisan storage:link      # una sola vez por servidor
  ```

  Sin este paso las firmas se guardan pero no se ven (ícono de imagen rota).

**b) `APP_URL`** en el `.env` del backend debe ser la IP o dominio real del servidor, no
`localhost` (con disco local, Laravel arma el link de cada firma con ese valor):

```
APP_URL=http://192.168.10.209:8000
```

**c) Permisos** de `storage/` y `bootstrap/cache/` para el usuario del servidor web
(`www-data` en Ubuntu + Nginx/Apache). Si fallan, las firmas dan error 400/500 al subirse:

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

**d) Sesión (opcional, recomendado).** El token dura `JWT_TTL` minutos (60 por defecto).
Para jornadas largas de registro se puede subir en el `.env` (por ejemplo `JWT_TTL=480`).
El frontend avisa 5 minutos antes de que venza y guarda el acta a medio llenar.

## 2. Frontend (este repositorio)

**a) En Docker** (producción; la imagen la publica GitHub Actions en Docker Hub como
`<usuario>/legumex-tic-formatos-frontend` en cada push a `main`). Las variables se leen **al
arrancar el contenedor**, no al compilar:

```bash
docker run -d -p 80:80 \
  -e VITE_AUTH_API_URL=http://192.168.10.209:8000/api \
  <usuario>/legumex-tic-formatos-frontend:latest
```

`VITE_STORAGE_URL` se puede omitir: se deriva quitándole `/api` a `VITE_AUTH_API_URL`.
Solo se define si los archivos se sirven desde otro dominio o puerto.

**b) En desarrollo** (`npm run dev`): las mismas variables en el `.env` del proyecto.

**c) Por qué importa la red del contenedor.** El PDF no puede "fotografiar" una imagen de
otro servidor, así que el propio nginx del frontend trae las firmas: `/storage/...` al
backend y `/firma-remota/...` a S3 (solo `*.amazonaws.com`, solo GET). Por eso:

- `VITE_AUTH_API_URL` debe ser una dirección que **el contenedor** alcance (con
  `localhost` apuntaría al propio contenedor, no al backend);
- con S3, el contenedor debe tener salida a internet.

Si no se puede, la firma se ve en pantalla pero el PDF sale con "Sin firma" y un aviso.

## 3. Cómo comprobar que quedó bien (2 minutos)

1. Crear una entrega de prueba con firma.
2. Abrir su detalle en Historial: la firma debe verse.
3. Pulsar "Descargar PDF": la firma debe salir en el PDF.
4. Si falla el paso 2:
   - con **S3**: abrir en el navegador el link de la firma que trae la API; si no carga,
     revisar credenciales y permisos del bucket (1a);
   - con **disco local**: abrir `http://<servidor>:8000/storage/signatures/<archivo>.png`;
     si no carga, falta `storage:link` o permisos (1a, 1c); si carga ahí pero no en el
     sistema, revisar `APP_URL` (1b) y `VITE_AUTH_API_URL` (2a).
5. Si falla solo el paso 3 (PDF): el contenedor del frontend no alcanza el backend o S3
   (2c). La consola del navegador muestra `[PDF] No se pudo incluir la firma` con cada
   dirección probada y su respuesta.
