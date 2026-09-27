# Legumex · Formatos TIC (frontend)

Sistema a medida del área TIC de Agroindustria Legumex para registrar las actas de
**entrega** y **devolución** de equipo (con firmas y PDF), llevar el inventario de equipos
y empleados, y consultar el historial por colaborador y por departamento.

- Rol `admin` (TIC): registra y corrige actas, catálogo y usuarios.
- Rol `user` (jefaturas / RRHH): solo consulta el historial, corrige las fechas del
  encabezado y descarga el PDF.

Stack: React 18 + Vite 5 + React Router 7 + Tailwind CSS 3. Backend:
[`legumexapps_tic_formatos_backend`](https://github.com/Roberto-Santizo/legumexapps_tic_formatos_backend) (Laravel).

## Cómo levantarlo

```bash
cp .env.example .env     # VITE_AUTH_API_URL = base del backend (…/api)
npm install
npm run dev              # http://localhost:5173
npm run build            # genera dist/
```

En producción corre en Docker (nginx); las variables se leen al arrancar el contenedor.
Detalle en `CLAUDE.md`, y el contexto completo (diseño, reglas, decisiones) en
`CONTEXTO_SISTEMA_DISENO_REGLAS.md`.

## Pendientes y mejoras sugeridas

Revisión del 2026-09-27. Nada de esto bloquea el uso diario; es para mantenimiento.

### Frontend

- **"Ver acta" tras registrar.** El POST no devuelve el acta creada, así que se descarga
  la lista completa de entregas (o devoluciones) para encontrar la más reciente del
  colaborador. Con pocas actas no se nota; con años de datos será lento. Opciones: que el
  backend devuelva el acta (ver abajo) o pedir `GET /delivery_documents?employeeId=X&limit=1`
  (el filtro `employeeId` falló en una prueba del 2026-09-11; confirmarlo antes de usarlo).
- **Peso del código.** El paquete principal pasa de 500 KB. Cargar cada pantalla bajo
  demanda (`React.lazy`) y `jspdf`/`html2canvas` solo al generar un PDF aceleraría la
  primera carga.
- **Accesibilidad.** Falta una revisión formal (lector de pantalla, contraste, teclado).

### Backend (`legumexapps_tic_formatos_backend`)

- **Devolver el acta creada** en `POST /delivery_documents` y `POST /return_documents`
  (hoy responden `data: true`). Evita la búsqueda de arriba.
- **Duración de la sesión.** El token dura 60 min (`JWT_TTL`). Para jornadas de registro
  largas: subir `JWT_TTL` en el `.env` o exponer una ruta `/refresh` (tymon/jwt-auth ya lo
  soporta; `refresh_ttl` está configurado). El frontend ya avisa 5 min antes y guarda el
  acta a medio llenar como borrador.
- **Permisos.** Solo crear/editar/borrar actas exige `admin`. Estas rutas solo piden
  sesión: `delivery_document_details` (POST/PUT/DELETE), `equipments` y `employees`
  (POST/PUT/DELETE). El frontend no se las muestra al rol `user`, pero conviene agregar el
  middleware `admin`. Riesgo bajo mientras el sistema esté solo en la red local.
- **Filtros en el servidor.** Las listas de actas no filtran por texto ni por departamento;
  el frontend lo hace en el navegador (descarga la lista completa al filtrar). Con mucho
  historial convendría `?search=` y `?departmentId=`.

### Decisiones tomadas (no son pendientes)

- **Las actas muestran el equipo tal como está hoy.** El renglón del acta lee la serie y
  el estado (nuevo/usado) del equipo actual; corregir el equipo corrige todas sus actas.
  Es intencional: permite arreglar un error de captura sin rehacer el acta.
- **Fechas corregidas solo en ese navegador** (fecha de entrega/devolución y
  Emisión/Vigencia del encabezado, en `localStorage`). Fue un requerimiento. Si algún
  día deben verse en todas las PC, hace falta un endpoint en el backend.
