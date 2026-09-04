# LEGUMEX — Qué es el sistema, cómo está diseñado, y reglas de trabajo

## Qué es

Sistema interno de Agroindustria Legumex, S.A. para digitalizar las hojas de control del Departamento de TIC (entrega y devolución de equipo, responsabilidad, etc.) y llevar un catálogo de datos maestros (empleados, equipos, marcas, departamentos). Antes esas hojas se llenaban en papel; ahora se llenan en pantalla y, para "Entrega de Equipo", quedan guardadas en el backend con historial consultable.

## Stack técnico

- **Frontend** (lo que se trabaja en esta carpeta, `LEGUMEXFRONTENFORMATOS`): React 18 + Vite + React Router v7 + Tailwind CSS 3. Librerías puntuales: `lucide-react` (íconos), `jspdf` + `html2canvas` (exportar actas a PDF), `react-signature-canvas` (captura de firma).
- **Backend**: Laravel, API REST bajo el prefijo de `AUTH_API_URL` (`VITE_AUTH_API_URL` en `.env`), con autenticación JWT (`jwt.auth`) y respuesta siempre en el sobre `{ statusCode, message, data }` (con `.errors` en validaciones 422). Lo administra otra persona — este frontend solo lo consume.

## Diseño visual

- Paleta monocromática tipo "ink" corporativa (Material 3, solo modo claro), con nombres de token M3 (`primary`, `surface`, `on-surface-variant`, `outline`, etc.) definidos en `tailwind.config.js`. El negro/gris es el color principal; el rojo (`error`, `error-container`) está reservado exclusivamente para eliminar y errores — no se usa para nada más.
- Tipografía y tamaños también van por clases con nombre semántico (`font-label-bold text-label-bold`, `font-body-md text-body-md`, `font-headline-lg text-headline-lg`, etc.), no tamaños sueltos de Tailwind.
- Transición de entrada consistente: clase `animate-view-in` (fade + leve desplazamiento) al entrar a una vista o al agregar una fila/tarjeta nueva. Ojo: por ser una animación con `transform`, no debe ponerse en un elemento que contenga dentro un panel con `position: fixed` (como el buscador con buscador de opciones), porque lo deja atrapado dentro de esa caja en vez de cubrir toda la pantalla — ya pasó una vez y se corrigió quitándola de ahí.
- Patrón repetido en TODO el sistema para listas: **escritorio** = tabla con íconos de acción (ojo=ver, lápiz=editar, basura=eliminar); **móvil** = tarjetas apiladas, sin botones visibles, tocar la tarjeta entera navega al detalle. El punto de quiebre entre "móvil" y "escritorio" en el layout general es **768px** (`md:` de Tailwind).
- Patrón repetido para filas repetibles de un formulario (características de un equipo, equipos de una entrega, etc.): en escritorio pueden ir en tabla; en móvil siempre van como tarjetas apiladas con cada campo etiquetado arriba, más un botón punteado "Agregar otra/otro" al final, nunca una tabla angosta con scroll horizontal.
- Selects que jalan datos de otra tabla del catálogo (Marca, Departamento, Equipo, Empleado) nunca son un `<select>` plano: siempre usan el componente `SearchableSelect` (buscador con lista filtrable), porque esas listas pueden crecer. En escritorio es un desplegable bajo el campo; en móvil se abre como hoja completa (fondo oscuro + buscador arriba + lista), igual que una alerta de confirmación.

## Reglas de código del proyecto

- **Un solo archivo de API**: todas las funciones que llaman al backend viven en `src/services/api.js`. Nunca se crean archivos de API separados por sección (ya se intentó antes y causó un bug de importaciones cruzadas — quedó documentado como lección aprendida).
- **Motor único de formularios**: las seis hojas físicas no son seis páginas distintas: son una sola (`FormatoActa.jsx`) configurada por `src/config/formatos.js` según el tipo. Si se agrega un formato nuevo, va en ese archivo de configuración, no como página aparte.
- Vistas de "ver" siempre cargan el registro por ID contra la API (no por estado de navegación), para que funcionen con URL directa y con refrescar la página.
- "Editar" y "Nuevo" siempre son una página dedicada, nunca un modal.
- No se inventan endpoints ni comportamientos del backend: si no está documentado o confirmado, se pregunta antes de asumir.

## Regla de trabajo (la más importante)

**Nunca se implementa ni se construye nada sin antes presentar el plan y recibir confirmación explícita del usuario.** Esto aplica a cualquier cambio en este proyecto, por pequeño que parezca: primero se plantea qué se va a hacer y por qué, se espera el visto bueno (o los ajustes que pida), y solo entonces se toca código. Esta regla la pidió el usuario explícitamente y quedó guardada como regla permanente del proyecto.

Reglas relacionadas que se han repetido en las peticiones de trabajo:
- No quitar ni agregar cosas al diseño que no se pidieron; usar el mismo estilo visual existente (tamaños de botón, espaciados, colores) en vez de inventar uno nuevo.
- Tocar solo los archivos necesarios para el cambio pedido.
- Guiarse por el código y los patrones ya existentes en el proyecto; si algo no está claro, preguntar en vez de suponer.
