# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio (frontend de **Legumex TIC Formatos**).

**Leer primero `CONTEXTO_SISTEMA_DISENO_REGLAS.md`**: es el documento de contexto permanente
(qué es el sistema, estado de los 6 formatos, diseño visual, reglas de trabajo). Este
CLAUDE.md no lo duplica; solo resume lo operativo y lo que ese archivo no cubre.

## Comandos

```bash
npm install          # deps (usa package-lock.json; en CI/Docker es `npm ci`)
npm run dev          # Vite en http://localhost:5173
npm run build        # genera dist/
npm run preview      # sirve dist/ localmente
```

No hay tests, linter ni TypeScript. Para verificar sintaxis de un `.jsx` sin levantar el
dev server: `npx esbuild <archivo> --loader:.jsx=jsx --jsx=automatic`
o simplemente `npm run build`.

## Stack

React 18 + Vite 5 + React Router v7 + Tailwind CSS 3 (plugins `forms`,
`container-queries`). `lucide-react` (íconos), `jspdf` + `html2canvas` (PDF),
`react-signature-canvas` (firmas). Solo JSX, sin TS. Todo el código y los comentarios están
en español; mantener ese idioma.

## Configuración / entorno

- `.env` (copiar de `.env.example`): `VITE_AUTH_API_URL` = base del backend Laravel
  (ej. `http://192.168.10.209:8000/api`). `VITE_STORAGE_URL` es opcional (se deriva
  quitando `/api`).
- **En Docker las variables se leen en runtime**, no en build: `docker/entrypoint.sh`
  escribe `/env.js` → `window.__ENV__`, que `index.html` carga antes de la app y
  `src/services/api.js` consulta antes de `import.meta.env`. Cualquier variable nueva debe
  agregarse en los tres sitios (`Dockerfile` ENV, `entrypoint.sh`, `api.js`).
- `Dockerfile` multi-stage (node:20-alpine build → nginx:1.27-alpine). `docker/nginx.conf`:
  SPA fallback a `index.html`, `env.js` sin caché, `/assets/` inmutable.
- CI: `.github/workflows/*` construye y publica la imagen a Docker Hub en cada push a
  `main` (tags `latest`, sha corto, fecha). Requiere secrets `DOCKERHUB_USERNAME` /
  `DOCKERHUB_TOKEN`.
- `GUIA_DESPLIEGUE_UBUNTU.md`: checklist del backend (APP_URL, `storage:link`, permisos)
  para que las firmas se vean en producción.

## Arquitectura (src/)

- `main.jsx` → `AuthProvider` + `BrowserRouter` → `App.jsx` (todas las rutas).
- `routes/RequireAuth.jsx` (redirige a `/login`) y `routes/RequireAdmin.jsx` (redirige a
  `/historial`). Roles: solo `admin` y `user`. **`user` solo accede a Historial**; todo lo
  demás (`/`, `/actas/*`, `/catalogo/*`, `/usuarios/*`) va envuelto en `RequireAdmin`.
- `context/AuthContext.jsx`: sesión en `localStorage` (`legumex_session`), `isAdmin`,
  `omitirConfirmacion` (solo en memoria). Escucha `EVENTO_SESION_EXPIRADA` (401 con
  token) y cierra sesión.
- `services/api.js`: **único archivo de API**. `laravelRequest()` desenvuelve el sobre
  `{ statusCode, message, data }` y lanza `Error` con `.status` y `.errors` (422). Las
  funciones `request`/`authRequest` contra `API_URL` son restos de Auditoría (backend
  Node ya inexistente) -- no tocar sin que se pida.
- `config/formatos.js`: objeto `FORMATOS` con los 6 formatos físicos; `ORDEN_FORMATOS`
  (`['entrega','devolucion']`) decide cuáles se muestran. `pages/FormatoActa.jsx` es el
  motor único que renderiza cualquier formato desde esa config.
- Flujo de devolución: nace siempre de una entrega existente
  (`BuscarDevolucion.jsx` → `RegistrarDevolucion.jsx`), no desde hoja en blanco.
- `pdf/`: `designSystemPdf.js` (CSS del papel), `plantillaEntrega.js`,
  `plantillaDevolucion.js`. `utils/generatePdf.js` pagina capturas de `html2canvas` en A4;
  `utils/generatePdfPapelFisico.js` monta la plantilla off-screen y cuenta hojas con las
  mismas constantes (`ALTO_PDF_MM`, `MIN_CONTENIDO_MM`) -- si cambian en uno, cambiar en
  el otro.
- `utils/fecha.js` / `hooks/useFechaLocal.js`: fechas locales sin desfase de zona horaria;
  usar estas utilidades, no `new Date(str)` directo.
- Componentes compartidos existentes (reusar, no duplicar): `ConfirmDialog`, `Toast`,
  `EstadoVacio`, `SearchableSelect`, `InlineEditableText`, `Buscador`, `Skeleton`,
  `FirmaPad`, `CaracteristicasEditor`, `EditorFechaLocal`, `Paginador`, `EquipoDetalleModal`.
- Listas paginadas: `hooks/usePaginacion.js` (`useListaPaginada`, estado `?page=&q=` en la
  URL, búsqueda híbrida porque el backend no filtra por texto) + `components/Paginador.jsx`.
  Contrato del backend en `paginacion.md`; `listar*(token, { limit, page })` en `api.js`.

## Reglas de código (resumen; detalle en CONTEXTO_SISTEMA_DISENO_REGLAS.md)

- Presentar plan y esperar confirmación antes de implementar, salvo instrucción concreta ya
  dada.
- Tocar solo los archivos estrictamente necesarios.
- No crear componentes compartidos nuevos (ej. `<Button>` genérico) sin autorización;
  el estilo es Tailwind repetido por elemento, a propósito.
- Vistas "ver" cargan por ID contra la API (funcionan con URL directa / refresh).
- "Nuevo" y "Editar" son páginas dedicadas, nunca modales.
- No inventar endpoints ni comportamiento del backend; preguntar si no está confirmado.
- Pantallas de tarjetas: `max-w-[1200px]` y la misma grilla que Catálogo / Nueva Acta /
  Historial.
- No tocar la sección de Auditoría (restos en `api.js`) sin pedido explícito.
- Mantener `CONTEXTO_SISTEMA_DISENO_REGLAS.md` actualizado cuando cambie algo estructural.
