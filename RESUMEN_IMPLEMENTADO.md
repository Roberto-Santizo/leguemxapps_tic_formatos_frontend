# LEGUMEX — Resumen de lo implementado (al 2026-09-04)

Frontend en React + Vite + Tailwind CSS, en la carpeta `LEGUMEXFRONTENFORMATOS`. El backend es Laravel y lo maneja otra persona; este frontend solo consume su API.

## 1. Las 6 hojas / actas (motor único)

Las seis hojas físicas del Departamento de TIC están implementadas con un solo motor de formularios (`src/pages/FormatoActa.jsx`), configurado por `src/config/formatos.js` según el `:tipo` de la URL (`/actas/:tipo/nueva`). Cada formato define su título, código, cláusulas legales, si tiene tabla de artículos, ficha técnica, teléfono, firmas, etc.

De las seis, solo **Entrega de Equipo** (código `E-EQUIPO`) está conectada a la API real de Laravel (`delivery_documents`). Las otras cinco siguen siendo un borrador visual (no envían nada al backend todavía).

## 2. Catálogo (datos maestros)

Sección del sidebar con cuatro subsecciones: **Empleados, Equipos (incluye Características), Departamentos y Marcas**. Las cuatro comparten exactamente el mismo patrón:

- Lista con buscador.
- "Ver" abre una página de detalle que carga el registro por ID (funciona con URL directa y con refrescar la página).
- "Editar" y "Nuevo" abren una página de formulario dedicada (no un modal).
- Escritorio: tabla con íconos de ojo (ver), lápiz (editar) y basura (eliminar). Móvil: tarjetas apiladas sin botones — tocar la tarjeta lleva directo al detalle.

Este patrón se unificó porque originalmente Marcas y Departamentos usaban un enfoque distinto (dependían del estado de navegación en vez de pedir el dato por ID, y la edición era en modal) — ya quedaron igual que Equipos, que era el patrón correcto desde el inicio.

## 3. Entrega de Equipo conectada a la API real

Es la funcionalidad más grande de esta etapa. Dentro del motor único de actas (`FormatoActa.jsx`), la rama de "Entrega de Equipo":

- Selecciona el **colaborador** con un buscador contra el catálogo real de Empleados; al elegirlo, el **departamento** se autocompleta solo (viene del empleado).
- Selecciona el o los **equipos entregados** con un buscador contra el catálogo real de Equipos (nunca texto libre).
- Cada equipo se agrega como una tarjeta con su selector y un campo de observaciones; se puede agregar más de uno o quitar cualquiera (incluso llegar a 0, mostrando un estado vacío con botón para agregar el primero).
- Las firmas (responsable y administrador de TI) se capturan con el componente de firma ya existente (`FirmaPad`) y se envían como imagen.
- Al finalizar, todo se envía por `POST /delivery_documents` (multipart/form-data, con los equipos en notación `items[i][campo]`).

### Historial de Actas

- `Historial.jsx` es ahora una landing con las 6 tarjetas (una por formato).
- Solo la tarjeta de "Entrega de Equipo" lleva a una lista real (`/historial/entrega`) con buscador, conectada a `GET /delivery_documents`. Las otras 5 muestran "Próximamente" hasta que el backend las exponga.
- Cada registro de la lista abre una vista de detalle (`/historial/entrega/:id`, fetch por ID) con el mismo formato visual de la acta física, botón para descargar el PDF, y botón Eliminar con confirmación. No hay opción de editar — la API no tiene endpoint para eso.
- Mismo patrón visual que el catálogo: tabla con ojo/basura en escritorio, tarjetas sin botones en móvil.

## 4. Ajustes de experiencia (última vuelta, tras revisión visual)

- La tabla de "Equipo/Accesorios" dentro de Entrega de Equipo, en pantallas móviles, pasó de una tabla con scroll horizontal a tarjetas apiladas (una por equipo), con botón para agregar más y "X" para quitar cualquiera sin mínimo.
- Arranca vacía (sin una fila de ejemplo) y muestra un estado vacío con ícono y botón "Agregar equipo" cuando no hay ninguno cargado, igual que el resto del sistema.
- Se corrigió que el buscador de equipo (componente `SearchableSelect`) no abría como "hoja completa" en pantallas de ancho intermedio dentro de esa tarjeta — se agregó una opción interna al componente (sin afectar los demás buscadores del sistema) para que use el mismo punto de quiebre móvil/escritorio que el resto de la app.

## 5. Pendiente / riesgos abiertos

- **Storage de imágenes de firma**: la URL para mostrarlas se construye siguiendo el comportamiento por defecto de Laravel (`APP_URL` + `/storage/` + ruta). Falta que el usuario confirme que esa URL realmente sirve la imagen en el backend real.
- **`delivery_document_details`** (agregar/quitar un solo equipo a un documento ya creado): la API lo permite pero se decidió no implementarlo todavía — quedó diferido a propósito.
- Queda un archivo sin usar en el proyecto, `src/pages/CatalogoRegistroView.jsx` (versión vieja de antes del refactor de Marcas/Departamentos) — no se pudo borrar por falta de herramienta de eliminación; se puede borrar manualmente sin riesgo.
