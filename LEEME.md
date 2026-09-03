# Implementación — menú de 6 formatos

Archivos listos para copiar dentro de `LEGUMEXFRONTENFORMATOS/`.
Todo usa los tokens de tu `tailwind.config.js`, `lucide-react`,
`react-router-dom`, tu `FirmaPad.jsx` y tu hook `useLocalStorageState`.
No se instalan dependencias nuevas.

## Archivos nuevos

| Copiar este archivo | A esta ruta |
| --- | --- |
| `src/config/formatos.js` | `src/config/formatos.js` |
| `src/pages/NuevaActa.jsx` | `src/pages/NuevaActa.jsx` |
| `src/pages/FormatoActa.jsx` | `src/pages/FormatoActa.jsx` |

## Archivos que se reemplazan

| Copiar este archivo | A esta ruta | Qué cambia |
| --- | --- | --- |
| `src/App.jsx` | `src/App.jsx` | `index` pasa de `<Devolucion />` a `<NuevaActa />` y se agrega la ruta `actas/:tipo/nueva` |
| `src/components/Sidebar.jsx` | `src/components/Sidebar.jsx` | El primer ítem pasa de "Hoja de Devolución" a "Nueva Acta" (icono `FilePlus2`) |

## Un paso manual

Pega el contenido de `index.css.snippet.css` al final de tu
`src/index.css`. Es el `@keyframes` del fade-in entre vistas; sin él las
clases `animate-view-in` simplemente no hacen nada (no rompe nada).

## Notas

- `src/pages/Devolucion.jsx` queda intacto y sin usar. Puedes borrarlo
  cuando confirmes que el nuevo flujo te sirve.
- El formato de **Responsabilidad** no ofrece elegir 1 ó 2 hojas: el papel
  ya es de dos hojas, así que todo el formulario va de corrido en una sola
  pantalla (`fichaSiempre: true` en el config).
- **Devolución** sí conserva su selector 1 / 2 páginas, como lo tenías.
- Agregar un séptimo formato = una entrada más en `config/formatos.js`
  y su id en `ORDEN_FORMATOS`. No se escriben componentes nuevos.
- Los botones `Finalizar…` todavía no llaman a la API: el backend de actas
  no expone endpoints. El `hojaRef` ya está puesto sobre el contenido
  imprimible para conectar `generatePdfFromElement` cuando lo necesites.


---

# Catálogo (Marcas y Departamentos)

Conectado a la API real de Laravel: `GET/POST /brands`, `PUT /brands/{id}`,
`GET/POST /departments`, `PUT /departments/{id}`, vía el helper
`laravelRequest` que ya existía. Sin datos de ejemplo: la pantalla arranca
en estado "Cargando..." y pinta lo que devuelva el backend.

## Archivos nuevos

| Copiar este archivo | A esta ruta |
| --- | --- |
| `src/pages/Catalogo.jsx` | `src/pages/Catalogo.jsx` |
| `src/pages/MarcasList.jsx` | `src/pages/MarcasList.jsx` |
| `src/pages/DepartamentosList.jsx` | `src/pages/DepartamentosList.jsx` |
| `src/components/CatalogoLista.jsx` | `src/components/CatalogoLista.jsx` |

## Un paso manual

`src/services/api.additions.js` **no es un archivo para copiar**: es el
bloque de código que debes pegar dentro de tu `src/services/api.js`
existente (las 8 funciones al final, y las 8 entradas en el
`export default`). Se entrega aparte para no sobrescribir tu archivo, que
tiene mucho más que esto.

## Por qué hay un `CatalogoLista.jsx`

Marcas y Departamentos son la misma pantalla con distinto texto y distinto
endpoint. Poner la lógica de cargar / buscar / crear / editar en cada página
sería duplicarla, así que vive una sola vez en `CatalogoLista` y las dos
páginas solo le pasan sus textos y sus tres funciones de API.

## Responsive

- **md: y superior** — tabla (`hidden md:block`), con `thead`/`tbody`,
  filas con hover y botón `Pencil` a la derecha.
- **Debajo de md** — tarjetas apiladas (`md:hidden`, `flex flex-col
  gap-stack-sm`): nombre a la izquierda, `Pencil` de `h-9 w-9` a la
  derecha, `break-words` en el nombre. Sin `overflow-x` en ningún punto.
- Los tres estados (cargando / vacío / sin resultados) usan el mismo
  componente y el mismo texto en ambos formatos; en móvil van centrados
  dentro de una tarjeta del mismo estilo.
- Buscador y botón de crear no cambian: ya eran responsive.
- Solo se usa el breakpoint `md` de Tailwind. Cero librerías nuevas.

## Alcance

- Solo **listar, crear y editar** el campo `name`. Sin botón de eliminar.
- El modal **no pide contraseña** (a diferencia de `ActaModal`): la API no
  la exige para estos `PUT`.
- **PDF y Exportar** están puestos como demo visual: deshabilitados, al 55%
  de opacidad y con tooltip "Disponible en una fase futura". Cuando el
  backend exponga esos endpoints, se conectan con el patrón de
  `BotonExcel.jsx`.
- Hay un estado de error con botón "Reintentar" si la API falla.


---

# Equipos y Características

Tercera entrada del Catálogo, conectada a `GET/POST /equipments`,
`PUT /equipments/{id}`, `GET/POST /caracteristics`, `PUT /caracteristics/{id}`.

## Archivos nuevos

| Copiar este archivo | A esta ruta |
| --- | --- |
| `src/pages/EquiposList.jsx` | `src/pages/EquiposList.jsx` |
| `src/pages/EquipoForm.jsx` | `src/pages/EquipoForm.jsx` |
| `src/components/CaracteristicasEditor.jsx` | `src/components/CaracteristicasEditor.jsx` |

## Archivos que se reemplazan

| Copiar este archivo | A esta ruta | Qué cambia |
| --- | --- | --- |
| `src/pages/Catalogo.jsx` | `src/pages/Catalogo.jsx` | Tercera tarjeta "Equipos" (ícono `HardDrive`), grid a 3 columnas en `lg:` |
| `src/App.jsx` | `src/App.jsx` | Rutas `catalogo/equipos`, `catalogo/equipos/nuevo`, `catalogo/equipos/:id` |

## Un paso manual

Pega el contenido de `src/services/api.equipos.js` al final de tu
`src/services/api.js` (9 funciones + sus entradas en el `export default`),
igual que hiciste con `api.additions.js`.

## Qué se reutiliza (nada nuevo inventado)

- `InlineEditableText.jsx` — la edición en sitio de cada característica es
  literalmente el mismo componente del "clic para escribir su nombre" de la
  firma de Devolución.
- `Buscador.jsx`, el bloque de estados (cargando / error / sin resultados /
  vacío), el botón de retroceso, el `h-11 rounded-lg` de inputs, los chips
  Sí/No con el mismo lenguaje que los chips de accesorios de `FormatoActa`,
  el `animate-view-in`, y el par tabla `hidden md:block` / tarjetas
  `md:hidden` de `CatalogoLista`.
- Gris de inactivo: `text-on-surface-variant opacity-55 cursor-not-allowed`,
  el mismo de los botones PDF/Exportar deshabilitados del Catálogo.

## Estados de la fila

- **Estado A** (sin características): texto "No contiene características",
  ojo y lápiz en gris inactivo (no clicables) y un `+` a la derecha, única
  entrada para empezar. Al desplegarlo abre directo el formulario de alta.
- **Estado B** (con características): ojo activo → despliega la vista rápida
  de solo lectura en la misma tabla; lápiz activo → `/catalogo/equipos/:id`
  con datos del equipo + características editables.
- La transición A → B es automática: al guardar la primera característica se
  recarga el detalle, el conteo pasa a 1, el `+` desaparece y los íconos se
  activan. No hace falta recargar la pantalla.

## Móvil

Sin dos íconos: se toca la tarjeta completa y se despliega debajo. Sin
características → texto "No tiene características" + formulario de alta ya
abierto. Con características → la lista, editable en sitio, más un enlace
"Editar datos del equipo". Cero scroll horizontal.

## Dos avisos sobre la API

1. **El equipo no tiene campo `description`.** `EquipmentRequest` exige
   `name`, `model`, `brand_id`, `serie`, `original`, `is_used`, `type` — no
   hay descripción. El formulario pide esos siete; lo descriptivo queda en
   Modelo/Tipo y en las características. Si quieres una descripción real del
   equipo hay que agregarla en el backend.
2. **`GET /caracteristics` no devuelve `description`**, solo
   `{ id, name, equipment }`. Para pintar "Memoria RAM: 16 GB" hay que pedir
   `GET /caracteristics/{id}` de cada una — eso hace
   `obtenerCaracteristicasDeEquipo`, y por eso el detalle se carga solo al
   desplegar una fila, no para toda la tabla. Si el backend agrega
   `description` al listado, esa función se simplifica a una sola llamada.
3. El listado de características identifica el equipo por **nombre**, no por
   id, así que el conteo por fila se arma cruzando nombres. Con dos equipos
   del mismo nombre el conteo se sumaría; conviene que el backend devuelva
   `equipment_id`.

## No se pueden repetir nombres

La validación de nombre duplicado dentro de un mismo equipo es de cliente
(`hayNombreRepetido` en `CaracteristicasEditor.jsx`): la API no la rechaza.
Avisa en rojo tanto en las filas del alta como al editar en sitio.
