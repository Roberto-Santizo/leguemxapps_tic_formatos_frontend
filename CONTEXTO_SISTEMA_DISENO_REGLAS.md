# LEGUMEX — Qué es el sistema, cómo está diseñado, y reglas de trabajo

> Este archivo es el punto de partida para cualquier agente de IA (o persona) que retome
> este proyecto sin haber estado en las sesiones anteriores. No es una lista de mejoras
> pendientes ni de tareas por hacer -- es una descripción de cómo está el sistema HOY y de
> las reglas de trabajo que se han pedido explícitamente. Es el único archivo `.md` de
> contexto del proyecto (los demás que existían -- `LEEME.md`, `AUDITORIA_VISUAL_UX.md`,
> `PLAN_PENDIENTE_PROXIMA_SESION.md`, `RESUMEN_IMPLEMENTADO.md` -- se unificaron aquí y se
> borraron el 2026-09-08 por estar desactualizados o ya resueltos).

## Qué es

Sistema interno de Agroindustria Legumex, S.A. para digitalizar las hojas de control del
Departamento de TIC (entrega y devolución de equipo, responsabilidad, préstamo, desecho,
teléfonos) y llevar un catálogo de datos maestros (empleados, equipos, marcas,
departamentos). Antes esas hojas se llenaban en papel; ahora se llenan en pantalla y, para
los formatos activos, quedan guardadas en el backend con historial consultable.

## Stack técnico

- **Frontend** (esta carpeta, `LEGUMEXFRONTENFORMATOS`): React 18 + Vite + React Router v7
  + Tailwind CSS 3. Librerías puntuales: `lucide-react` (íconos), `jspdf` + `html2canvas`
  (exportar actas a PDF), `react-signature-canvas` (captura de firma).
- **Backend**: Laravel, API REST bajo el prefijo de `AUTH_API_URL` (`VITE_AUTH_API_URL` en
  `.env`), con autenticación JWT (`jwt.auth`) y respuesta siempre en el sobre
  `{ statusCode, message, data }` (con `.errors` en validaciones 422). Lo administra otra
  persona -- este frontend solo lo consume; no se inventan endpoints ni comportamientos del
  backend, si no está documentado o confirmado se pregunta antes de asumir.

## Estado de los 6 formatos físicos (importante, cambió)

Los seis formatos están definidos en `src/config/formatos.js` (objeto `FORMATOS`), pero
**hoy solo 2 están activos y visibles** en las pantallas de "Nueva Acta" e "Historial de
Actas": **Entrega de Equipo** y **Devolución de Equipo**. Esto lo controla el array
`ORDEN_FORMATOS` (`['entrega', 'devolucion']`) del mismo archivo -- es la única fuente de
verdad para qué tarjetas se muestran en ambas pantallas (`NuevaActa.jsx` y
`Historial.jsx` simplemente mapean sobre `LISTA_FORMATOS`, que se deriva de
`ORDEN_FORMATOS`).

Los otros cuatro (`responsabilidad`, `prestamo`, `desecho`, `telefonos`) siguen definidos
dentro de `FORMATOS` -- por si algún registro histórico del backend todavía los
referencia -- pero **no aparecen en ninguna pantalla**. En particular, "Entrega de
Teléfonos" se quitó explícitamente de Nueva Acta e Historial porque su botón "Finalizar
Entrega" no está conectado a ningún endpoint del backend (el formulario se llenaba y se
perdía sin aviso). Si en el futuro se conecta un backend real para alguno de estos cuatro,
el cambio es agregarlo de nuevo a `ORDEN_FORMATOS` -- no hace falta tocar componentes.

De los 2 activos:
- **Entrega de Equipo**: conectado a backend real (`listarDocumentosEntrega`,
  `eliminarDocumentoEntrega`, etc. en `src/services/api.js`), con historial completo
  (listar, ver, eliminar) en `HistorialEntregaList.jsx` / `HistorialEntregaView.jsx`.
- **Devolución de Equipo**: también conectado a backend real, pero con un flujo distinto --
  una devolución no se llena desde una hoja en blanco, siempre nace de una entrega ya
  existente. Por eso su tarjeta en "Nueva Acta" no lleva a `/actas/devolucion/nueva` como
  las demás, lleva a `/historial/devolucion/nueva` (`BuscarDevolucion.jsx`), donde primero
  se busca al responsable/la entrega correspondiente y luego se abre la hoja ya con los
  datos completos (`RegistrarDevolucion.jsx`). Su historial (`HistorialDevolucionList.jsx`)
  permite buscar y ver, pero no eliminar.

## Motor único de formularios

Los seis formatos físicos comparten la misma gramática (membrete, datos del usuario, tabla
de equipo, cláusula fija, observaciones, firmas), así que **no existe una página por
formato**: existe `FormatoActa.jsx`, que lee la configuración de `src/config/formatos.js`
según el `id` de la URL y arma el formulario dinámicamente. Agregar un séptimo formato, o
reactivar uno de los cuatro inactivos, es agregar/editar una entrada en `formatos.js` --
nunca escribir un componente de página nuevo para eso.

## Diseño visual

- Paleta monocromática tipo "ink" corporativa (Material 3, solo modo claro), con nombres de
  token M3 (`primary`, `surface`, `on-surface-variant`, `outline`, etc.) definidos en
  `tailwind.config.js`. El negro/gris es el color principal. Los únicos colores son:
  - **Rojo** (`error`, `error-container`): eliminar, errores y marcar un equipo como
    **extravío** en la devolución (fila, badge y botón en rojo -- pedido explícito del
    cliente, no un descuido).
  - **Verde salvia y ocre** (`available*` / `assigned*`): solo el badge de estado
    "Disponible" / "En posesión" de Catálogo → Equipos. Van apagados al mismo nivel de
    saturación que el rojo: fondo claro + texto oscuro + punto intermedio.

  Nada más lleva color, y ningún color se escribe suelto (`bg-green-100`, hex en línea): si
  hace falta uno nuevo, se registra como token en `tailwind.config.js`.
- Tipografía y tamaños también van por clases con nombre semántico (`font-label-bold
  text-label-bold`, `font-body-md text-body-md`, `font-headline-lg text-headline-lg`,
  etc.), no tamaños sueltos de Tailwind.
- Transición de entrada consistente: clase `animate-view-in` (fade + leve desplazamiento)
  al entrar a una vista o al agregar una fila/tarjeta nueva. Ojo: por ser una animación con
  `transform`, no debe ponerse en un elemento que contenga dentro un panel con `position:
  fixed` (como el buscador con lista de opciones), porque lo deja atrapado dentro de esa
  caja en vez de cubrir toda la pantalla -- ya pasó una vez y se corrigió quitándola de ahí.
- **Animación de "presión" en botones/tarjetas clicables**: todo `<button>` y todo `<Link>`
  clicable del sistema lleva `active:scale-[0.97] transition-transform` (botones
  normales), `active:scale-[0.90]` (botones chicos de solo ícono: ver, editar, cerrar,
  quitar) o `active:scale-[0.99]` (tarjetas grandes tipo Catálogo/Nueva Acta/Historial).
  Si un botón ya tenía otro efecto `active:` (como `active:brightness-95`), se combinan,
  no se reemplazan; si ya usa `transition-all`, basta con `active:scale-[...]`. La
  auditoría del 2026-09-11 encontró 17 clicables sin ella (justo los botones principales
  de las listas, los "Cancelar", los "Volver al historial" y el menú lateral) y se
  completaron. Cualquier botón o tarjeta clicable nueva debe llevarla para no romper la
  consistencia. (Excepción: los enlaces de texto subrayado dentro de un párrafo, como
  "Regístrala en Marcas", no la llevan -- un elemento en línea no se escala.)
- **Grillas de tarjetas fluidas**: en vez de un tope fijo de columnas (`sm:grid-cols-2
  xl:grid-cols-3`) con un `max-w` angosto, las pantallas de selección de tarjetas
  (`Catalogo.jsx`, `Historial.jsx`, `NuevaActa.jsx`) usan un `style` inline
  `gridTemplateColumns: 'repeat(auto-fit, minmax(Npx, 1fr))'` dentro de un contenedor
  `max-w-[1200px]` (el mismo ancho en las tres pantallas, para que el espacio lateral se
  vea igual en todas). Esto evita huecos vacíos cuando el número de tarjetas no llena las
  columnas fijas, y hace que las tarjetas crezcan para ocupar el ancho disponible. Patrón
  ya usado antes en `SkeletonDetalle` (`Skeleton.jsx`), reutilizado en vez de inventado.
  Las tres comparten además todo lo demás, con `Catalogo.jsx` como referencia: márgenes
  `md:p-stack-lg`, separación `gap-stack-lg`, `minmax(280px, 1fr)`, tarjeta
  `rounded-2xl p-6`, ícono en caja de `h-14 w-14` y título de tarjeta `headline-md` (el
  título de la pantalla es `headline-lg`). Hasta el 2026-09-11 cada una tenía los suyos.
- **Ancho de "ver" y "editar"**: la vista de detalle y el formulario de una misma entidad
  usan el mismo ancho, para que el contenido no salte al pasar de una a otra: 600px en
  Marcas, Departamentos, Empleados y Usuarios (una columna), 900px en Equipos (formulario
  a dos columnas y tablas de características e historial). Las listas van a 1200px.
- Patrón repetido en TODO el sistema para listas: **escritorio** = tabla con íconos de
  acción (ojo=ver, lápiz=editar, basura=eliminar); **móvil** = tarjetas apiladas, sin
  botones visibles, tocar la tarjeta entera navega al detalle. El punto de quiebre entre
  "móvil" y "escritorio" en el layout general es **768px** (`md:` de Tailwind).
- Patrón repetido para filas repetibles de un formulario (características de un equipo,
  equipos de una entrega, etc.): en escritorio pueden ir en tabla; en móvil siempre van
  como tarjetas apiladas con cada campo etiquetado arriba, más un botón punteado "Agregar
  otra/otro" al final, nunca una tabla angosta con scroll horizontal.
- Selects que jalan datos de otra tabla del catálogo (Marca, Departamento, Equipo,
  Empleado) nunca son un `<select>` plano: siempre usan el componente `SearchableSelect`
  (buscador con lista filtrable), porque esas listas pueden crecer. En escritorio es un
  desplegable bajo el campo; en móvil se abre como hoja completa (fondo oscuro + buscador
  arriba + lista), igual que una alerta de confirmación.
- **Texto editable inline** (`InlineEditableText.jsx`, usado p. ej. en la vigencia del
  membrete de Nueva Acta): el ícono de lápiz que indica que el texto es editable queda
  siempre visible a baja opacidad (`opacity-40`), no solo con `group-hover`, porque en
  móvil/táctil el hover nunca se dispara -- sube de opacidad al pasar el mouse en
  escritorio, pero en táctil el affordance debe verse siempre. Por defecto no deja
  guardar el texto vacío (vuelve el valor anterior); las observaciones del historial usan
  `permitirVacio` + `placeholder="Sin observaciones"` para poder dejarlas en blanco (se
  guardan como `null`).
- Botón de "registrar nuevo" en las listas de historial: siempre visible en el encabezado
  de la pantalla (junto al título), no solo cuando la lista está vacía -- patrón consistente
  entre `HistorialEntregaList.jsx` y `HistorialDevolucionList.jsx`.

## Sección de Auditoría -- eliminada (2026-09-08)

La sección de Auditoría (`src/pages/Auditoria.jsx`, la ruta `/auditoria`, y su ítem en
`Sidebar.jsx`) se eliminó por completo del sistema, por instrucción explícita del usuario
(el archivo `Auditoria.jsx` había quedado en `src/pages/` sin ruta; se borró el
2026-09-11),
después de confirmarse contra el swagger completo del backend que **no existe ningún
endpoint de auditoría/logs del sistema** (se revisaron todos los tags documentados: Auth,
Usuarios, Marcas, Departamentos, Equipos, Características, Empleados, Documentos de
Entrega/Devolución y sus detalles -- ninguno expone algo así). Las funciones
`obtenerAuditoria(token)` y `exportarAuditoriaExcel(token, password)` que quedaron escritas
en `src/services/api.js` de una fase anterior siguen ahí sin usarse; si se llegan a limpiar
o el backend agrega un endpoint real de logs a futuro, es tema aparte y requiere pedirlo
explícitamente en esa sesión -- no reconstruir esta sección por iniciativa propia.

Si se necesita algo parecido a "quién tuvo qué equipo y cuándo", eso sí existe hoy con datos
reales: `GET /equipments/{id}/history` y los listados de `/delivery_documents` /
`/return_documents` con sus filtros -- es auditoría de movimientos de equipo, no de cambios
al catálogo (crear/editar/eliminar Marcas, Departamentos, Equipos, Empleados no deja
ningún rastro en la API actual).

## Limpieza de código muerto (2026-09-11)

Tras una auditoría del proyecto se borraron, por no tener ningún uso (sin import, sin ruta,
sin referencia): `Header.jsx`, `ConfirmModal.jsx` (duplicaba a `ConfirmDialog`),
`BotonExcel.jsx`, `Loading.jsx`, `ErrorMessage.jsx` (tenía la sintaxis corrupta),
`pages/Devolucion.jsx`, `pages/Auditoria.jsx`, `pages/CatalogoRegistroView.jsx` (el vivo
es el de `components/`) y los tres `api.*.js`. De `api.js` salieron el bloque de "actas"
del sistema pre-Laravel, `eliminarUsuario` (apuntaba a una ruta que nunca existió),
`checkApiHealth` y `exportarActasExcel`. Si se busca alguno de estos, no es que se haya
perdido: está en el historial de git.

## Dar de baja equipos -- implementado y retirado el mismo día (2026-09-11)

`DELETE /api/equipments/{id}` existe y está documentado como baja lógica: *"la tabla
`equipments` usa soft deletes, así que el registro conserva su historial y deja de aparecer
en los listados"*. Se implementó (basura en Catálogo → Equipos y botón "Dar de baja" en el
detalle) y **se retiró el mismo día**, porque en la práctica el backend no cumple esa
promesa: al dar de baja un equipo, `GET /delivery_documents` **y** `GET /return_documents`
empiezan a responder 500 con *"Attempt to read property 'name' on null"* -- leen el nombre
del equipo desde su registro (`equipments.name`) y no incluyen los que están dados de baja.
Resultado: los dos historiales quedan caídos para todos los usuarios, no solo las actas que
tenían ese equipo.

Para volver a agregarlo hacen falta dos cosas del lado del backend: incluir los equipos
retirados al leer entregas y devoluciones (en Laravel, `withTrashed()` en esa relación), y
restaurar el equipo que ya se dio de baja (`deleted_at = NULL`) para levantar el historial.
Mientras eso no esté, no hay forma de retirar equipo del inventario desde el sistema.

Los filtros del listado de entregas (`status`, `employeeId`, `location`) tampoco se usan por
el mismo tipo de problema: `?location=1` responde con el mismo error de PHP. Ver el
comentario en `listarDocumentosEntrega` (`src/services/api.js`).

## Reglas de código del proyecto

- **Un solo archivo de API**: todas las funciones que llaman al backend viven en
  `src/services/api.js`. Nunca se crean archivos de API separados por sección (ya se
  intentó antes y causó un bug de importaciones cruzadas -- quedó documentado como lección
  aprendida). (Existían `api.additions.js`, `api.empleados.js` y `api.equipos.js`, que
  parecían excepciones, pero eran borradores "para pegar al final de api.js" que ya se
  habían pegado: nunca se importaban y ni siquiera funcionaban solos. Se borraron el
  2026-09-11; hoy `api.js` es el único archivo de API.)
- **Motor único de formularios**: ver sección arriba -- todo cambio a un formato físico va
  en `src/config/formatos.js`, no como página nueva.
- Vistas de "ver" siempre cargan el registro por ID contra la API (no por estado de
  navegación), para que funcionen con URL directa y con refrescar la página.
- "Editar" y "Nuevo" siempre son una página dedicada, nunca un modal.
- No se inventan endpoints ni comportamientos del backend: si no está documentado o
  confirmado, se pregunta antes de asumir.
- No se crean componentes compartidos nuevos (por ejemplo un `<Button>` genérico) sin
  autorización explícita, aunque parezca que "ordenaría" el código -- el estilo actual es
  cada elemento con su propia clase de Tailwind repetida, y así se ha mantenido a propósito
  incluso al tocar 102 botones en 29 archivos.

## Reglas de trabajo (las más importantes)

**Nunca se implementa ni se construye nada sin antes presentar el plan y recibir
confirmación explícita del usuario**, salvo que el propio usuario ya haya dado la
instrucción concreta y completa de qué cambiar (en ese caso se ejecuta directamente, sin
volver a pedir permiso para lo ya autorizado). Esto aplica a cualquier cambio en este
proyecto, por pequeño que parezca: ante la duda, se plantea qué se va a hacer y por qué, se
espera el visto bueno (o los ajustes que pida), y solo entonces se toca código.

Reglas relacionadas que se han repetido en las peticiones de trabajo:
- **No tocar la sección de Auditoría** sin que el usuario lo pida explícitamente en esa
  sesión (ver sección dedicada arriba).
- No quitar ni agregar cosas al diseño que no se pidieron; usar el mismo estilo visual
  existente (tamaños de botón, espaciados, colores, anchos de contenedor) en vez de
  inventar uno nuevo -- por ejemplo, cualquier pantalla de tarjetas nueva debe respetar el
  mismo `max-w-[1200px]` y el mismo patrón de grilla fluida que ya usan Catálogo, Nueva
  Acta e Historial, no un ancho distinto "a ojo".
- Reusar componentes y patrones ya existentes (`ConfirmDialog`, `Toast`, `EstadoVacio`,
  `SearchableSelect`, `InlineEditableText`, `Buscador`, `Skeleton*`, `BotonExcel`, etc.) en
  vez de crear uno nuevo con el mismo propósito.
- No crear componentes compartidos nuevos sin autorización explícita.
- Tocar solo los archivos estrictamente necesarios para el cambio pedido.
- Guiarse por el código y los patrones ya existentes en el proyecto; si algo no está claro,
  preguntar en vez de suponer.
- Antes de dar un cambio visual por terminado, verificar espaciados/tamaños contra la
  pantalla de referencia más parecida que ya exista (por ejemplo, comparar contra Catálogo
  al tocar Historial o Nueva Acta), no solo que "se vea bien" de forma aislada.

## Flujo de trabajo técnico (cuando se edita desde un entorno con puente al dispositivo)

Cuando el trabajo se hace desde una sesión en la nube con acceso al equipo del usuario vía
herramientas de "device bridge" (sin edición directa en el equipo del usuario), el flujo
correcto es:
1. Traer (stage) el/los archivo(s) reales del proyecto del usuario a un entorno de trabajo
   local a la sesión.
2. Editar esa copia local.
3. **Verificar la sintaxis de cada archivo tocado (por ejemplo con esbuild, cargando JSX
   con `loader: 'jsx', jsx: 'automatic'`) antes de darlo por bueno.**
4. Copiar el archivo verificado a la carpeta de salida de la sesión.
5. Confirmar (commit) ese archivo de vuelta a la ruta real del proyecto en el equipo del
   usuario -- el trabajo no está terminado hasta que el archivo quede guardado ahí, no solo
   entregado en el chat.

No editar nunca "a ciegas" sin pasar por el paso de verificación de sintaxis, y no dar un
cambio por completo sin haber hecho el commit al proyecto real del usuario.

---

*Este archivo se debe mantener actualizado según el sistema evolucione -- a diferencia de
`PLAN_PENDIENTE_PROXIMA_SESION.md` (que es bitácora desechable), este es el documento de
contexto permanente del proyecto.*
