# Auditoría Visual / UX — LEGUMEX TIC · Formatos (2026-09-07)

*Panel: ingeniería UX, desarrollo frontend, soporte TI (uso diario) y RRHH/administración (uso ocasional). Código revisado en profundidad: todas las páginas de `src/pages/`, componentes de `src/components/`, `AppLayout.jsx`, `formatos.js`, `index.css` y `tailwind.config.js`.*

*No incluye puntos ya resueltos en esta sesión ni los ya anotados en `PLAN_PENDIENTE_PROXIMA_SESION.md` (grid de Catálogo, endpoint de Auditoría, animación de botones).*

## 1. Resumen ejecutivo

El sistema tiene una base de diseño sólida y coherente (tokens M3, patrón tabla/tarjeta, diálogos y toasts unificados), y la mayoría de pantallas de un mismo "tipo" se sienten hechas por el mismo equipo. Sin embargo, hay **bloqueadores reales** antes de cerrar esta etapa: un formato promovido como activo (Entrega de Teléfonos) tiene un botón de guardar que no hace nada, la vista de Empleado rompe la regla propia del sistema de cargar por ID (falla al refrescar o abrir por enlace directo), y "Registrar usuario" es el único alta del sistema que usa un modal en vez de página dedicada. Ninguno de estos requiere rediseñar nada — son desalineaciones puntuales con reglas que el propio proyecto ya definió — pero sí deben resolverse porque generan pérdida de datos silenciosa o rompen la confianza en el patrón "se ve igual, funciona igual" que el resto del sistema construyó bien.

## 2. Fortalezas a mantener

- **Sistema de tokens M3 aplicado con disciplina**: colores, tipografía y radios siempre por clase semántica (`text-body-md`, `bg-surface-container-lowest`, etc.), nunca valores sueltos. El rojo queda exclusivo de error/eliminar en todas las pantallas revisadas.
- **Patrón lista unificado**: tabla + iconos en escritorio, tarjetas táctiles sin botones en móvil, con el mismo breakpoint (`md`) en Catálogo, Historial y sus variantes. Se siente como un solo sistema, no seis pantallas distintas.
- **`ConfirmDialog` como único diálogo de confirmación**, con portal a `document.body`, animación de entrada/salida y variante "peligro" reservada de verdad para lo irreversible (eliminar).
- **Skeletons con la forma real del contenido** (tabla, tarjetas, formulario, detalle) en vez de una rueda centrada: no hay saltos de layout al cargar.
- **`EstadoVacio` consistente** para vacío / error / sin resultados en casi todas las listas, con el mismo ícono de la tarjeta de origen para dar continuidad visual.
- **Toasts como único punto de "esto ya quedó guardado"**, con tono neutro (no verde) para éxito, coherente con la regla de que el rojo es solo para error.
- **Carga por ID en las vistas de detalle** está bien resuelta en Equipos, Marcas y Departamentos (URL directa y refresco funcionan) — exactamente la regla que el propio proyecto se impuso.

## 3. Puntos críticos — resolver antes de cerrar esta etapa

### 3.1. "Entrega de Teléfonos" tiene un botón de guardar que no hace nada
**Dónde:** `src/pages/FormatoActa.jsx`, formato `telefonos`.
**Qué pasa:** el botón de acción usa `onClick={esEntrega ? handleClicFinalizarEntrega : undefined}` — como `esEntrega` solo es verdadero para Entrega de Equipo, en Teléfonos el botón "Finalizar Entrega" (idéntico visualmente al que sí guarda) no dispara nada. No hay guardado, ni error, ni toast, ni PDF — solo una etiqueta gris que dice "Borrador · sin guardar".
**Por qué le importa:** soporte TI señaló que es uno de los tres formatos que el sistema ahora promueve como "listos para usar". Alguien llena un formulario largo (firmas, IMEI, plan tarifario) y todo se pierde sin ningún aviso.
**Dirección de mejora:** mientras Teléfonos no tenga backend, su acción principal debe comunicarse como lo que es (por ejemplo, exportar/imprimir lo llenado), o avisar de forma mucho más visible, antes de llenarlo, que es solo un borrador.

### 3.2. La vista de Empleado no sobrevive a un refresco de página ni a un enlace directo
**Dónde:** `src/pages/EmpleadoView.jsx`.
**Qué pasa:** a diferencia de Marcas, Departamentos y Equipos (cargan por ID contra la API), Empleado recibe los datos por `location.state?.empleado` — solo funciona navegando desde la lista. Al refrescar, abrir en pestaña nueva o compartir el enlace, muestra "No hay información para mostrar". `obtenerEmpleado(token, id)` **ya existe** en `services/api.js` pero no se usa aquí.
**Por qué le importa:** es exactamente el patrón que `CONTEXTO_SISTEMA_DISENO_REGLAS.md` documenta como ya corregido en Marcas/Departamentos. RRHH, que consulta Catálogo de vez en cuando, es quien más lo sufre.
**Dirección de mejora:** que Empleado cargue por ID como el resto del catálogo.

### 3.3. "Registrar usuario" es el único alta del sistema que usa un modal, no una página
**Dónde:** `src/pages/Usuarios.jsx` (`RegistrarUsuarioModal`).
**Qué pasa:** la regla escrita del propio proyecto es "Editar/Nuevo siempre es página dedicada, nunca modal" — se cumple en Marcas, Departamentos, Equipos y Empleados. Usuarios es la única excepción.
**Por qué le importa:** quien administra usuarios nota el salto de patrón frente a todo lo demás en el sistema.
**Dirección de mejora:** llevar "Registrar usuario" a una página dedicada, mismo patrón que las otras cuatro.

### 3.4. El texto editable en línea es invisible al tacto
**Dónde:** `src/components/InlineEditableText.jsx` (usado en Historial de Entrega/Devolución, Características, y fecha de Emisión/Vigencia).
**Qué pasa:** el lápiz que indica "editable" solo aparece con `group-hover`; en celular no existe hover, así que nunca aparece.
**Por qué le importa:** quien usa el sistema desde el celular no tiene ninguna pista de que puede corregir una observación o el nombre de una característica.
**Dirección de mejora:** un indicio visual permanente (aunque sea a menor opacidad), no solo al pasar el mouse.

### 3.5. El historial de Entregas no ofrece una forma directa de registrar una nueva
**Dónde:** `HistorialEntregaList.jsx` vs `HistorialDevolucionList.jsx`.
**Qué pasa:** Devolución siempre muestra un botón primario "+ Registrar devolución" en el encabezado. Entrega solo lo ofrece dentro del estado vacío; en cuanto ya hay una entrega registrada, esa acción desaparece.
**Por qué le importa:** soporte TI usa Entregas a diario — es la pantalla con más fricción justo en su tarea más repetida.
**Dirección de mejora:** que Entregas tenga el mismo botón persistente en el encabezado que ya tiene Devoluciones.

### 3.6. Los botones "PDF/Exportar" (demo) aparecen en 2 de las 4 secciones de Catálogo
**Dónde:** `CatalogoLista.jsx` (Marcas/Departamentos) vs `EquiposList.jsx`/`EmpleadosList.jsx`.
**Qué pasa:** Marcas y Departamentos muestran botones deshabilitados "PDF/Exportar" ("disponible en fase futura"); Equipos y Empleados no muestran nada.
**Por qué le importa:** RRHH, quien más valoraría exportar la lista de Empleados, no ve ninguna señal de que eso está planeado.
**Dirección de mejora:** un solo criterio para las 4 secciones — el par de botones demo en las cuatro, o en ninguna.

## 4. Oportunidades de mejora — no bloqueantes, a futuro

### 4.1. Botones de "quitar fila" más pequeños en tarjetas móviles
`FormatoActa.jsx` y `HistorialEntregaView.jsx` usan `h-8 w-8` (32px) para quitar un equipo; el resto del sistema (`CaracteristicasEditor.jsx`) usa `h-11 w-11` (44px) para la misma acción. Alinear al tamaño táctil estándar del sistema.

### 4.2. El buscador no tiene etiqueta accesible propia
`src/components/Buscador.jsx` se identifica solo por ícono + placeholder, sin `aria-label`. Se usa en más de diez pantallas — cambio mínimo con efecto amplio.

### 4.3. Archivos sueltos que ya no forman parte del sistema activo
`ErrorMessage.jsx` (contenido duplicado/corrupto, sin uso), `ConfirmModal.jsx` (el propio comentario de `ConfirmDialog.jsx` dice que ya no existe, pero el archivo sigue ahí), `Header.jsx` (huérfano, con texto de marcador de posición). Ninguno afecta lo que ve el usuario hoy, pero son riesgo de reutilizarse por error a futuro.

### 4.4. El estado "sin equipo" del detalle de una Entrega no usa `EstadoVacio`
En `HistorialEntregaView.jsx`/`HistorialDevolucionView.jsx`, el caso "sin equipo registrado" es un texto suelto en vez del componente `EstadoVacio` que usa el resto del sistema.

### 4.5. El subtítulo de "Historial de Actas" promete más de lo que cada tarjeta cumple
"Ver, buscar y eliminar las actas ya registradas" aplica sin matices a las tres tarjetas, pero solo Entrega permite eliminar. Cada tarjeta ya aclara su propio alcance en el pie, así que la confusión es leve.

## 5. Conclusión del panel

Los cuatro coincidieron en que la base del sistema (tokens, patrón lista/detalle, diálogos, toasts, skeletons) está lo bastante madura como para no tocarse al resolver lo de arriba — el trabajo pendiente es de alineación puntual, no de rediseño. Los primeros tres puntos críticos (Teléfonos sin guardar, Empleado sin carga por ID, Usuarios con modal) son la mayor prioridad porque violan reglas que el propio proyecto ya se impuso por escrito y probó en el resto del sistema — no son juicios de gusto, son inconsistencias objetivas frente a la propia documentación.

Hubo un desacuerdo real en el punto 3.4 (affordance del texto editable en móvil): soporte TI, que usa el sistema a diario, dijo que "ya sabe" dónde tocar y no le genera fricción real. RRHH, que entra con mucha menos frecuencia, insistió en que se quedaría sin saber que esa observación se puede corregir, y probablemente llamaría a soporte en vez de hacerlo ella misma. El ingeniero de UX se alineó con RRHH porque el diseño debe funcionar para quien no ha aprendido el atajo, no solo para quien ya lo memorizó — por eso el punto se mantiene como crítico pese a la objeción del usuario frecuente.
