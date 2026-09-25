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

- **Sistema visual "Sierra"** (2026-09-24, rama `rediseno-ui`; referencia: mockup "Mesa TIC —
  Propuesta sierra"). Solo modo claro. Se conservaron los nombres de token Material 3
  (`primary`, `surface`, `on-surface-variant`, `outline`, etc.) y cambiaron sus valores, así
  que el rediseño llegó a todo el sistema sin reescribir cada className:
  - **Papel** `#f4f5f1` de fondo (`background` = `papel`); superficies **blancas** encima;
    paneles de solo lectura / activos suaves `#ebede7` (`surface-container-high`); gris de
    tabla/pie `#f5f5f5` (`surface-container`).
  - **Tinta**: títulos `#171717` (`on-surface`), secundario `#525252` / `#737373`
    (`on-surface-variant` / `on-surface-subtle`), bordes `#e5e5e5` (`outline-variant`),
    filete `#a3a3a3` (`outline`). CTA negro `bg-tinta` (`#0a0a0a`, hover `tinta-hover`).
    - Contraste: `on-surface-subtle` (#737373) solo sobre blanco o `surface-container-low`
      (4.74 / 4.54:1). Sobre papel, `surface-container` o `surface-container-high` no llega
      a AA (4.33 / 4.35 / 4.02:1): ahí se usa `on-surface-variant` (#525252, 7.4:1).
      `outline` (#a3a3a3, 2.5:1) nunca va en texto: solo filetes y chevrons decorativos.
  - **Foco y enlaces**: azul `foco` (`#2563eb`).
  - **Verde de marca** (`bosque #0b2a1e`, `brote`, `linea`, `exito`): SOLO en marca, login y
    cordillera de fondo. En la app no hay verde en superficies ni textos. El login no usa
    las clases: repite esos valores como variables `--lg-bosque`, `--lg-acento`,
    `--lg-linea` y `--lg-exito` en `index.css` (bloque `.lg-raiz`); si cambia uno, cambiar
    ambos.
  - **Rojo** (`error*`): eliminar, errores y marcar un equipo como **extravío** en la
    devolución (fila, badge y botón en rojo -- pedido explícito del cliente).
  - **Verde salvia y ocre** (`available*` / `assigned*`): el badge "Disponible" / "En
    posesión" de Catálogo → Equipos y, desde la ronda 2 del rediseño, el **punto** de color
    del chip de estado de Historial → Devolución (`devuelto` = `bg-available`, `parcial` =
    `bg-assigned`, otro = `bg-outline`; `HistorialDevolucionList.jsx`, `puntoEstado`), el
    del chip "N pendientes" de Registrar devolución (`BuscarDevolucion.jsx`, `bg-assigned`:
    pendiente de devolver = parcial) y el del chip "Corregida aquí" de `EditorFechaLocal`
    (`bg-assigned`: aviso de que esa fecha es un ajuste local, no el dato del servidor). El
    chip siempre es neutro (blanco, borde `outline-variant`, texto `on-surface`/`-variant`):
    solo el punto lleva color. En ningún otro lugar. Apagados, al mismo nivel de saturación
    que el rojo.
  - Nada se escribe suelto (`bg-green-100`, hex o `rgba(...)` en JSX): colores, radios
    (`rounded-boton` 8px, `rounded-tarjeta` 16px, `rounded-menu` 10px, `rounded-aviso` 22px,
    `rounded-casilla` 4px del checkbox),
    sombras (`shadow-tarjeta` = sombra corta + filete de 1px en vez de `border`;
    `shadow-tarjeta-hover`, `shadow-tarjeta-foco`, `shadow-flotante`, `shadow-cajon`,
    `shadow-barra-inferior`) y tiempos (`duration-fast|base|page`, `ease-standard|salida|rebote`)
    están en `tailwind.config.js`. Si hace falta uno nuevo, se registra ahí.
- **Tipografía**: Inter (400–800) para todo y **JetBrains Mono** (`font-mono` / `font-eyebrow`)
  para eyebrows, códigos, series, contadores y encabezados de tabla (mayúsculas, tracking
  .1–.12em). Manrope queda cargada (`index.html`, 700/800) SOLO para el título del papel
  aprobado (ver abajo). Tamaños siempre por token, nunca `text-[Npx]`:
  - `text-display-lg` (32/800/−0.04em): título de pantalla en escritorio; en móvil
    `text-titulo-movil` (26px/30px/800/−0.04em) → `text-titulo-movil md:text-display-lg`.
  - `text-headline-lg` (24/700), `text-headline-md` (18/700, título de sección/tarjeta),
    `text-body-lg` (16), `text-body-md` (14).
  - `text-meta` (12px/16px): labels de formulario (`text-meta font-semibold`), metadatos y
    códigos en tabla (`font-mono text-meta`).
  - `text-micro` (11px/14px): etiquetas mono de tabla, paginador y chips; el tracking va
    aparte: `font-mono text-micro uppercase tracking-[0.1em]`.
  - `text-eyebrow` (11px, .12em) y `text-input-movil` (16px, inputs en móvil: evita el zoom
    de iOS al enfocar).
  - `text-nano` (10px/16px, mono: marca del menú, pie, chip "Corregida aquí") y
    `text-titulo-modal` (20/28/600/−0.02em: título de `ConfirmDialog` y
    `EquipoDetalleModal`).
  - **Papel** (hoja de entrega/devolución en pantalla, aprobada por el cliente): su título
    usa `font-papel text-titulo-papel` (Manrope 24/32/800/−0.02em = el `headline-lg` de
    origin/main + `font-extrabold`). Los tokens `headline-*` cambiaron a Inter en el
    rediseño; dentro del papel NO se usan para no alterar lo aprobado. Si un token global
    que el papel usa cambia, comparar la hoja contra una captura de origin/main.
  - Cada pantalla abre con **eyebrow de migas** (filete de 28px + ruta en mayúsculas) sobre
    el `h1`: `SECCIÓN / SUBSECCIÓN[ / ACCIÓN]`. Primer nivel: `ACTAS / NUEVA`, `HISTORIAL`,
    `CATÁLOGO`, `USUARIOS`; subpantallas p. ej. `CATÁLOGO / MARCAS / DETALLE`,
    `HISTORIAL / PRÉSTAMO`; vistas de detalle `… / DETALLE` (`HISTORIAL / ENTREGA /
    DETALLE`), hoja nueva `ACTAS / NUEVA / ENTREGA`, registrar `HISTORIAL / DEVOLUCIÓN /
    REGISTRAR`. Las migas no repiten texto crudo de la URL. `EnConstruccion` recibe la ruta
    en la prop de texto `migas` (sin `migas` no pinta eyebrow). Nada de "LEGUMEX / X".
- **Recetas repetidas a propósito** (sin `<Button>` genérico; al crear una pantalla nueva,
  copiar las clases de la más parecida):
  - Botón primario negro `h-10 rounded-boton bg-tinta text-white hover:bg-tinta-hover`;
    secundario blanco con `border-outline-variant`; peligro = secundario con `text-error`.
    Botones de cabecera con `whitespace-nowrap shrink-0`.
  - Botón volver `h-9` con flecha; separación volver → eyebrow `mt-6` (móvil `mt-5`).
  - **Botón ícono de tabla** (ver/editar/eliminar; se conservan los íconos, no el botón
    "Editar" con texto del mockup): `h-9 w-9 inline-flex items-center justify-center
    rounded-boton text-on-surface-variant hover:bg-surface-container hover:text-on-surface
    active:scale-[0.90] transition`; eliminar con `hover:bg-error-container/60
    hover:text-error`. Columna de acciones alineada a la derecha y de ancho fijo.
  - Tarjeta `bg-white rounded-tarjeta shadow-tarjeta` (sin `border` extra). Tabla con
    `thead` gris (`bg-surface-container`), `th` mono `text-micro`, filas de 72px y el pie
    gris con el `Paginador` dentro (ver Paginación). Chip de estado con punto.
  - **Hover de fila**: `hover:bg-surface-container` en las 6 tablas (uno solo en todo el
    sistema).
  - **Columna de acciones fija** (solo Equipos, la única tabla que desplaza en horizontal:
    `min-w-[900px]`): `th`/`td` `sticky right-0` con fondo propio (`bg-surface-container` en
    el `th`; `bg-white` + `group-hover:bg-surface-container` en la celda, con `group` en la
    fila) y filete `before:` de 1px a su izquierda. El envoltorio `overflow-x-auto` es
    `@container` y el filete se oculta con `@[900px]:before:hidden`: solo se ve cuando la
    tabla realmente se desplaza (ancho real del contenedor, no un breakpoint del viewport).
    Sus acciones son 3 ranuras fijas de 36px (ojo, lápiz y "+" solo si aplica), así que el
    encabezado "ACCIONES" va `text-left`: empieza en la misma x que el ojo.
  - **Cabecera de las vistas "ver"** (Equipo, Empleado, Usuario, `CatalogoRegistroView`):
    grid `grid-cols-[minmax(0,1fr)_auto]` con el envoltorio del texto en `contents` (no
    cambia el orden del DOM: eyebrow → h1 → bajada → botón). Eyebrow `col-span-2`; "Editar"
    en `col-start-2 row-start-2`: en móvil `self-start mt-px` (centrado con la primera línea
    del título, 26/30px) y la bajada `col-span-2` a todo el ancho; desde `md:` el botón
    `row-span-2 self-end` (al pie de la bajada) y la bajada `md:col-span-1`.
  - **Alturas**: inputs, selects y `SearchableSelect` de formulario `h-11` (44px); botones
    de formulario y de cabecera `h-10`; volver `h-9`; botones ícono `h-9 w-9`; `Buscador`
    `h-11`.
  - **Márgenes**: todas las pantallas (listas, formularios, vistas, hojas, búsqueda) usan el
    mismo contenedor `px-4 pt-6 pb-10 md:px-8 md:pt-10` con su `max-w` de siempre.
    Formularios y vistas "ver" alinean su tarjeta a la IZQUIERDA del mismo carril de 1200px
    que las listas, para que su borde izquierdo coincida con el de ellas en cualquier ancho:
    `max-w-[600px]` (o 900) + `ml-[max(0px,calc((100%_-_1200px)/2))]` (el 1200 debe ser el
    mismo `max-w` de las listas), o un envoltorio `mx-auto max-w-[1200px]` con la tarjeta
    dentro sin `mx-auto`. Solo el papel de las hojas va centrado.
  - Orden de botones: el de siempre (Cancelar a la izquierda, primario a la derecha,
    alineados a la derecha en escritorio); el rediseño no mueve ni cambia de tipo ningún
    botón. La hamburguesa del `MobileHeader` va a la izquierda, del lado del que entra el
    cajón.
- **Foco (un solo indicador por elemento)**, definido en `index.css`; las pantallas no ponen
  clases de foco propias en sus inputs:
  - Botones, enlaces, tarjetas clicables: anillo azul `foco` de 2px con 2px de separación en
    `:focus-visible`. Sigue el radio propio del elemento (no se fuerza `border-radius`).
  - Inputs, selects y textareas: sin anillo azul (el navegador los marca `:focus-visible`
    también con el mouse); el borde pasa a tinta y un filete de 1px en la sombra lo engrosa
    a 2px. Reemplaza el borde + anillo azules de `@tailwindcss/forms`. El disparador de
    `SearchableSelect` (un botón que se ve como campo) imita lo mismo con
    `focus:border-on-surface focus:ring-1 focus:ring-on-surface`; ABIERTO baja a solo
    `border-on-surface` (1px), porque el indicador grueso lo lleva el buscador del
    desplegable, donde se teclea (un solo contorno fuerte a la vez). El `Buscador` (sin
    borde) usa `focus:shadow-tarjeta-foco`.
  - La hoja de papel conserva sus clases de foco propias (ganan por ser utilidades).
- **Cordillera de fondo** (`components/SierraFondo.jsx`, componente decorativo autorizado):
  tres capas SVG de montaña en `bosque` fijas al pie (`clamp(240px,42vh,420px)`, opacidades
  8/22/42%) con deriva lenta (120s / 80s en contrasentido / 52s). Quieta en móvil, sin
  animación con movimiento reducido, oculta al imprimir. La montan `AppLayout` (detrás del
  shell, z-0) y `NotFound`. **Regla de contraste**: ningún texto a nivel de pantalla va
  directo sobre la montaña; va en tarjeta blanca o sobre papel. **Sin `backdrop-blur` en
  ningún tamaño** sobre la cordillera: la sierra deriva sin fin y un `backdrop-filter`
  encima la re-muestrea y desenfoca en cada cuadro (costo de GPU constante en las PC de
  planta), y en móvil daba tirones al hacer scroll. Barras inferiores, pie (la pastilla
  "© LEGUMEX", también desde `md:`) y cabeceras van en `bg-papel` opaco, sin blur (al 95%
  se leía a través el texto que pasa por debajo; con velo al 90% la montaña se veía bajo el
  texto del pie). El token `papel-velo` queda disponible, sin uso en `src/`.
- **Shell** (`layouts/AppLayout.jsx`): menú lateral de 240px (`w-drawer-width`) transparente
  sobre el papel (ítem activo = tarjeta blanca), tarjeta de perfil al pie ("Cerrar Sesión"
  con `active:scale-[0.97]`, ícono sin rojo); `<main data-sheet>` scrollea por dentro, es
  transparente y reserva el canal de la barra de scroll (`md:[scrollbar-gutter:stable]`)
  para que el contenido no salte. El shell es `relative` sin z-index a propósito: no crea
  contexto de apilamiento y el cajón (z-50), la barra móvil (z-30), las barras de acciones
  (z-30), el Toast (z-70) y los portales (diálogos, SearchableSelect) compiten en el
  contexto raíz. Móvil: barra superior de 56px en `bg-papel` OPACO (al 95% se leía el
  texto que pasa por debajo) y sin blur, isotipo con `alt=""` (el nombre ya va en texto),
  hamburguesa a la izquierda, y cajón desde la izquierda (`invisible` cerrado, para que no reciba foco).
  - **Barras de acciones de las hojas** (entrega, devolución y sus vistas): `fixed inset-x-0
    bottom-0 md:left-drawer-width z-30` con el atributo **`data-barra-inferior`** (lo usa el
    Toast en `index.css`), de borde a borde del área de contenido y por encima del canal del
    scroll (una barra sticky dentro del `<main>` quedaba 8px corta y, al final del scroll,
    suelta sobre la montaña). Fondo `bg-papel` opaco + `shadow-barra-inferior`,
    sin blur. En escritorio lleva `md:overflow-hidden md:[scrollbar-gutter:stable]`: reserva
    el mismo canal de 8px que el `<main>`, así su contenido (`mx-auto max-w-4xl`) queda
    alineado con la hoja. Costo aceptado: tapa los últimos ~64px del riel de scroll del
    `<main>`. El espacio para que nada quede debajo NO va en la hoja sino en el `<footer>`
    hermano: la raíz de la pantalla lleva
    `[&+footer]:pb-[calc(<alto>+env(safe-area-inset-bottom))] md:[&+footer]:pb-[88px]`, con
    `<alto>` = alto de la barra en móvil + 24px (88 / 114 / 136 según cuántas filas ocupe la
    barra de cada hoja). Si una barra cambia de alto, se ajusta ese número (y el del Toast,
    abajo). El `<main>` tiene `scroll-pb-36` para que un campo enfocado con Tab no quede bajo
    la barra. `animate-view-in` va en el contenedor interior, nunca en un ancestro de la
    barra.
  - **Toast** (`[data-toaster]`): abajo en móvil (`bottom-[calc(16px+env(safe-area-inset-bottom))]`,
    a lo ancho con 12px de margen, entra subiendo); arriba en móvil tapaba el botón "volver"
    justo después de guardar y el toque solo cerraba el aviso. Desde `sm:` va arriba a la
    derecha (bajo la barra móvil de 56px hasta `md:`) y desde `md:` en
    `right-[max(42px,calc(50vw_-_715px))] top-10`: borde derecho en el del carril de 1200px
    de listas y formularios (32px de padding del `<main>` + 10px de canal de scroll; por
    encima de ~1512px el carril se centra y `50vw − 715px` lo sigue) y borde superior a la
    altura del botón volver. Excepciones (reglas en `index.css`):
    1. **Hojas con barra fija** (`data-barra-inferior`): en TODOS los tamaños va 12px por
       encima de la barra y, desde `md:`, alineado con el borde derecho de sus botones
       (arriba tapaba el eyebrow de la hoja). La barra mide 64/90/112/116px según ancho,
       número de botones y si muestra un error de validación, así que no se adivina en
       CSS: mientras hay avisos, `Toast.jsx` la mide con un `ResizeObserver` (y un
       `MutationObserver` la sigue si aparece o desaparece con el aviso visible) y escribe
       en su propio contenedor `data-sobre-barra`, `--alto-barra` (alto real, safe-area
       incluida) y `--derecha-barra`. Es puramente visual: sin estado de React, sin tocar
       las páginas. Regla: `[data-toaster][data-sobre-barra] { top:auto;
       bottom: calc(var(--alto-barra) + 12px) }` y desde `md:` `right: var(--derecha-barra)`.
       No usa `:has()`, así que vale en cualquier navegador.
    2. **Cajón móvil abierto** (`<768`, el overlay lleva `data-cajon-abierto`):
       `body:has([data-cajon-abierto]) [data-toaster]` → dentro del cajón (`left:12px`,
       ancho `min(304px, 86%) − 24px`), a `bottom: 140px`, por encima de la tarjeta de
       perfil / "Cerrar Sesión" (pie del cajón 20px + tarjeta 108px + 12px). Gana a la 1.
    3. **Sin `:has()`** (Firefox < 121, p. ej. ESR 115 en Windows 7/8): regla
       `@supports not selector(:has(*))` → en móvil (`<640`) el toast sin barra sube
       siempre a `140px + safe-area`, por encima de "Cerrar Sesión" con o sin cajón.
- **Login** (`pages/Login.jsx`, estilos con prefijo `lg-` en `index.css`): telón verde con el
  logo que baja con borde de cordillera (solo la primera vez por sesión del navegador,
  `sessionStorage`); **mientras cubre, la tarjeta queda `inert`** (no se puede escribir a
  ciegas; en React 18 se pasa como string: `inert={telonCubre ? '' : undefined}`; al migrar
  a React 19 cambiar a `inert={telonCubre}`). La tarjeta termina de aparecer a los 2.5 s,
  junto con el telón, con la opacidad LINEAL y aparte del salto (`lgCardRise` + `lgFade`),
  e `inert` se quita en el `animationend` de su `lgFade`: nunca se ve completa antes de
  estar interactiva. Al quedar libre se enfoca el usuario. Sol, nubes, cuatro capas de montaña con
  parallax al mouse (una escritura por cuadro con `requestAnimationFrame`; apagado en
  pantallas táctiles y con movimiento reducido), titular línea por línea y tarjeta que
  sube. "Verificando…" con isotipo que se llena; si es correcto, saludo en verde letra por
  letra (la ola se ajusta para que la última letra termine su salto de 360 ms antes de
  navegar) y check dibujado (anunciado a lectores de pantalla por una región `aria-live`
  montada desde el inicio; las letras van `aria-hidden`), y se navega **650 ms después**
  (400 ms con movimiento reducido) al mismo destino de siempre: se cobra en cada inicio de
  sesión, por eso es corto. Si falla, aviso y sacudida del formulario. La lógica de
  `login()` / destino / `replace` no cambió.
- **Cargas con el logo y "acta registrada"** (2026-09-24, estilos al final de `index.css`):
  - `IsotipoCarga.jsx`: isotipo que se llena de izquierda a derecha. Reemplaza al círculo
    que gira (`Loader2`, ya no se usa) en todo botón que guarda o genera algo. `tono="claro"`
    sobre botón negro, `tono="tinta"` sobre fondo claro; alto `h-3` en botones y `h-2.5` en
    botones de solo ícono. En las barras de las hojas se oculta bajo `sm` (`max-sm:!hidden`)
    porque partía el texto del botón; ahí la espera con logo ya da la señal.
  - `IndicadorGuardando` (exportado de `Toast.jsx`, `<IndicadorGuardando activo={estado}
    texto="Guardando" />`): pastilla blanca con el isotipo que se llena y texto mono, dentro
    del mismo contenedor del Toast. Así hereda su posición (arriba a la derecha en
    escritorio, abajo en móvil, sobre la barra de las hojas) y el aviso negro de "ya quedó"
    aparece en el mismo lugar cuando termina. Entra a los 150ms: una respuesta instantánea
    no parpadea. **Es la señal de todas las escrituras del CRUD**: crear/editar marca,
    departamento, equipo, empleado y usuario, características, eliminar una entrega, y en
    el historial agregar/quitar equipo y corregir observaciones (para estas últimas cada
    vista tiene un contador `corrigiendo`, solo visual, alrededor de la llamada).
  - `EsperaLogo.jsx` (`<EsperaLogo activa={estado} mensaje="…" />`): espera de pantalla
    completa, con las montañas del isotipo en silueta negra de fondo y el isotipo a color
    llenándose de abajo arriba, mensaje mono y barra. **Solo para lo pesado**: guardar una
    entrega o una devolución y generar el PDF. Bloquea los clics desde el inicio, se ve a
    los 250ms y, una vez visible, dura al menos 600ms. **No se agregan retrasos a las
    operaciones.** Las listas y vistas siguen con esqueletos (`Skeleton`) al cargar.
  - `ActaRegistrada.jsx`: al guardar una entrega o devolución, tarjeta con check que se
    dibuja, dos anillos y chispas (1,5 s; 0,5 s con movimiento reducido). Después se muestra
    el Toast y se navega igual que antes (mismo destino); el temporizador se limpia si la
    página se desmonta. Es el único cambio de tiempo en esos flujos, pedido por el cliente.
- **Movimiento**: `animate-view-in` (entrada de pantalla: 8px, 280 ms, curva estándar),
  `animate-pop-in` (filas/tarjetas nuevas), `animate-drop-in` (desplegables),
  `animate-badge-pop` (contadores), `animate-card-rise` (tarjeta del 404), `shimmer`
  (esqueletos), `animate-hint-in` (errores de campo), `animate-icon-pop` (ícono del Toast),
  `animate-overlay-in` (fondo del cajón), `animate-toast-in` / `animate-toast-in-abajo`
  (Toast escritorio / móvil), `animate-sierra-*` (deriva de la cordillera), `data-reveal`
  (revelado al hacer scroll con `animation-timeline: view()`, solo donde el navegador lo
  soporta, solo escritorio y **solo en tarjetas**: en filas `<tr>` no funciona porque la
  línea de tiempo se ata al contenedor con overflow de la tabla, y en tarjetas `md:hidden`
  tampoco, porque bajo 768px está anulado). Solo existen los keyframes que usa alguna
  pantalla (`page-in` se quitó por no tener uso).
  **Toda animación de entrada usa `fill-mode: backwards` (nunca `both`/`forwards`) y
  termina en `transform: none` / `translate: none`**: un transform residual convierte al
  elemento en contenedor de sus hijos `position: fixed` (el buscador con lista de opciones
  quedó atrapado así una vez, y la espera con logo quedaba dentro del área de contenido).
  Ojo: con `both`, Chrome deja un `matrix(1,0,0,1,0,0)` al final aunque el keyframe diga
  `none`; con `backwards` el elemento vuelve a su estilo propio al terminar. Solo las
  animaciones que deben quedarse en su estado final (salidas, anillos y chispas de
  `ActaRegistrada`, login) usan `both`, y ninguna envuelve elementos `fixed`.
  `prefers-reduced-motion` se respeta globalmente en `index.css` (todo se resuelve al
  instante; sierra, parallax y revelado apagados).
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
  del contenedor común (ver Recetas), separación `gap-stack-lg`, `minmax(280px, 1fr)`,
  tarjeta `rounded-tarjeta shadow-tarjeta p-6`, ícono en caja `h-14 w-14` y título de
  tarjeta `headline-md` (el título de la pantalla es `display-lg`). Hasta el 2026-09-11
  cada una tenía los suyos.
- **Ancho de "ver" y "editar"**: la vista de detalle y el formulario de una misma entidad
  usan el mismo ancho, para que el contenido no salte al pasar de una a otra: 600px en
  Marcas, Departamentos, Empleados y Usuarios (una columna), 900px en Equipos (formulario
  a dos columnas y tablas de características e historial). Las listas van a 1200px.
  Desde el rediseño Sierra esas tarjetas van alineadas a la izquierda (sin `mx-auto`).
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
- **Serie como eje del selector de equipo** (`SearchableSelect` con `codigo`, 2026-09-17):
  las opciones aceptan `{ id, name, codigo? }`. Con `codigo` la fila va a dos líneas (nombre
  arriba, código en mono abajo, sin truncar), el código queda siempre completo a la derecha
  del campo cuando hay opción elegida (lo que se trunca es el nombre), la búsqueda también
  filtra por código ignorando mayúsculas/espacios/guiones/puntos (teclear los últimos 4-5
  caracteres del sticker basta) y Enter elige la única coincidencia. Hoy solo lo usa el
  equipo en Entrega de Equipo (`FormatoActa.opcionesEquipoParaFila`, `codigo` = serie,
  ordenado por nombre y luego serie). Marca/Departamento/Empleado siguen pasando
  `{ id, name }` y se ven igual. Motivo: diez "Dell Latitude" iguales solo se distinguen
  por la serie, y antes iba pegada al final del nombre y se cortaba.
- **Búsqueda por serie y filtro de estado en Catálogo → Equipos** (`EquiposList.jsx`,
  2026-09-21): el buscador encuentra por nombre, marca y **serie**, y la serie se muestra
  bajo el nombre (mono, mayúsculas) en la fila y en la tarjeta -- un resultado que no la
  enseña no se puede contrastar contra la etiqueta del equipo. No hay columna aparte: la
  tabla ya se desborda a 768px. La regla de comparación de series es `normalizarBusqueda`
  (`utils/texto.js`), compartida con `SearchableSelect` para que los dos buscadores
  encuentren exactamente lo mismo; ignora mayúsculas, espacios, guiones, puntos y guiones
  bajos, y no matchea cuando la búsqueda normalizada queda vacía (teclear "-" no puede
  devolver el inventario entero). Arriba de la lista, tres botones **Todos / Disponible /
  En posesión** con los mismos tokens de color que el badge de cada fila. El estado NO es
  un campo del equipo: se deriva cruzando con `/equipments/available`, así que el filtro no
  se puede delegar al backend y **obliga a traer el inventario completo** -- entra por el
  mismo `modo: 'todos'` de `useListaPaginada` que ya usaba la búsqueda (prop `filtroExtra`),
  porque filtrar solo la página visible mostraría 4 de 20 filas mientras el paginador sigue
  diciendo 57. Los botones se ocultan si `/equipments/available` falla (y el filtro se borra
  de la URL), igual que el badge, para no ofrecer un filtro que daría un resultado
  equivocado. El estado elegido vive en la URL (`?estado=disponible`) junto a `page`,
  `limit` y `q`.
- **Ficha del equipo desde el acta** (`EquipoDetalleModal.jsx`, 2026-09-17): en Entrega de
  Equipo, el buscador de equipo muestra un ojo dentro del campo (prop `onVerDetalle` de
  `SearchableSelect`, solo cuando ya hay equipo elegido) que abre una ventana emergente de
  solo lectura con marca, modelo, serie, tipo, original/usado y características. Carga por
  ID (`obtenerEquipo` + `obtenerMarca` + `obtenerCaracteristicasDeEquipo`, igual que
  `EquipoView`), no del renglón del listado. No sustituye a Catálogo → Equipos → Ver ni
  lleva historial de asignaciones. Solo vive en `FormatoActa`; la devolución queda fuera a
  propósito (no elige equipo de un catálogo).
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

## Paginación de listados (2026-09-14)

Las cinco listas con tabla (Marcas y Departamentos vía `CatalogoLista.jsx`, `EquiposList`,
`EmpleadosList`, `HistorialEntregaList`, `HistorialDevolucionList`) se paginan contra el
backend (`paginacion.md`: `limit` + `page` → `{ data, total, currentPage, lastPage }`).
Sin librería externa: el estado vive en la URL con `useSearchParams` de React Router.

- `?page=N&limit=M&q=texto`. **La URL siempre lleva `page` y `limit` explícitos** (los
  mismos que van al backend): al entrar a la vista sin ellos, o con valores inválidos, el
  hook la completa de inmediato con `replace` (`/catalogo/marcas` →
  `/catalogo/marcas?page=1&limit=20`) (2026-09-17). Cambiar de página agrega entrada al
  historial, escribir en el buscador reemplaza (y vuelve a página 1). Refrescar, "atrás" y
  enlaces directos conservan página, tamaño y búsqueda.
- `hooks/usePaginacion.js`: `TAMANO_PAGINA = 20` es el `limit` por defecto que se escribe
  en la URL; el que se usa realmente es el `limit` de la URL (`limite`), y se mantiene
  constante al navegar (cambiarlo invalida `lastPage`). `usePaginaUrl()` (solo URL) y
  `useListaPaginada({ token, listar, filtrar, mensajeError })`, que hace la carga y expone
  `registros`, `total`, `pagina`, `limite`, `ultimaPagina`, `busqueda`, `setBusqueda`,
  `limpiarBusqueda`, `irAPagina`, `cargando`, `error`, `recargar`.
- El texto del buscador vive en estado local del hook y la URL lo sigue (no al revés):
  React Router v7 aplica cada navegación como transición de baja prioridad, y un `<input>`
  controlado directamente por `q` perdía letras al escribir a velocidad normal (bug
  corregido 2026-09-17). Un cambio externo de `q` (enlace del menú a la misma lista) sí se
  adopta.
- **Búsqueda híbrida**, porque el backend no tiene filtro de texto en estos listados: sin
  texto se pide al servidor solo la página actual; con texto se pide UNA vez el listado
  completo (sin `limit`), se filtra en el cliente como antes y se pagina en el cliente con
  el mismo tamaño. Cuando el backend exponga `search`, se cambia en el hook, no en las
  pantallas.
- Página fuera de rango (`data: []` con `page > lastPage`, p. ej. al borrar el último
  registro de la última página) → el hook sustituye en la URL por la última página válida.
  Tras eliminar (HistorialEntrega) se vuelve a pedir la página actual (`recargar`), no se
  quita la fila a mano.
- `components/Paginador.jsx` (autorizado explícitamente): "Mostrando 1–20 de 57 marcas ·
  Página 1 de 3" + Anterior / números con "…" / Siguiente. **Se muestra SIEMPRE** debajo de
  la tabla / tarjetas -- también con una sola página o con 0 registros ("0 marcas · Página
  1 de 1", flechas deshabilitadas) -- para que se sepa en qué página se está y cuántas hay
  (regla del 2026-09-17). Solo se oculta mientras carga (esqueleto) o si hubo error. En
  móvil los números se sustituyen por "Página 2 de 5". Recibe `tamano={limite}` para
  calcular el rango. Es el único componente de paginación: toda lista nueva lo reutiliza.
  Por sí solo se dibuja como una franja gris con el conteo en mono ("MOSTRANDO 1–20 DE 57
  MARCAS"). Las listas con tabla lo meten **dentro de la tarjeta de la tabla**, en el pie
  gris, y le pasan la prop de solo estilo `enPie`: en escritorio pierde su propia tarjeta
  para no dibujar una caja dentro de otra; en móvil (tarjetas) sigue siendo una tarjeta
  suelta debajo. Sus botones miden 40px de alto en móvil (objetivo táctil) y 32px desde
  `md:`, dentro del pie. (Antes lo detectaba con un selector sobre la clase del padre; se cambió
  por la prop explícita, que se puede encontrar con grep.)
- Las funciones `listar*` de `api.js` aceptan `{ limit, page }` opcional (helper interno
  `listarPaginado`, y `laravelRequest(..., { conMeta: true })` para no perder los
  metadatos al desenvolver). Sin ese argumento siguen devolviendo el arreglo completo, que
  es lo que usan selectores, combos y listados de apoyo (`listarDepartamentos` en
  formularios, `listarCaracteristicas` para el conteo de Equipos, `listarDocumentosEntrega`
  en BuscarDevolucion, etc.). Detalles de entrega/devolución y `/users` no se paginan.

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
  `SearchableSelect`, `InlineEditableText`, `Buscador`, `Skeleton*`, `Paginador`,
  `EquipoDetalleModal`, `SierraFondo` (decorativo), etc.) en
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
