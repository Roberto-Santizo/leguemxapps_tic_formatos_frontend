# Plan pendiente — próxima sesión (a partir del 2026-09-07)

**Estado (2026-09-08): puntos 1 y 3 ya están implementados y guardados en el proyecto. Solo queda el punto 2 (Auditoría), que sigue tal cual se dejó -- se decidió explícitamente no tocarlo en esta vuelta.**

## 1. Arreglar el diseño de Catálogo (2 columnas con hueco vacío) -- ✅ HECHO

**Problema actual:** `src/pages/Catalogo.jsx` fuerza la grilla de las 4 tarjetas (Marcas, Departamentos, Equipos, Empleados) a `grid-cols-1 sm:grid-cols-2` con `max-w-3xl` fijo. En pantallas anchas esto dejaba las 4 tarjetas apretadas en una sola fila; el ajuste que se hizo para separarlas (capar el ancho a `max-w-3xl`, 768px) sí las separó, pero como el contenedor de la página es más ancho (hasta 1200px), queda un hueco vacío grande a la derecha — se ve descuadrado, no "roto" pero sí asimétrico.

**Solución propuesta:** en vez de un límite de ancho fijo + tope de columnas, usar una grilla fluida con `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` (estilo inline, igual patrón que ya usa `SkeletonDetalle` en `src/components/Skeleton.jsx` para su propia grilla — no es un patrón nuevo). Con un mínimo de 280px por tarjeta:
- En pantallas medianas se acomodan 2 por fila.
- En pantallas muy anchas puede llegar a 3-4, pero sin apretarse porque cada tarjeta nunca baja de 280px.
- Ocupa todo el ancho de los 1200px del contenedor, sin hueco vacío ni límite arbitrario.

Archivo a tocar: solo `src/pages/Catalogo.jsx` (reemplazar la clase `grid grid-cols-1 gap-stack-lg sm:grid-cols-2` + `max-w-3xl` por el `style` con `gridTemplateColumns`, quitando el `max-w-3xl`).

## 2. Sección de Auditoría -- ⏳ PENDIENTE (no tocar hasta que se pida explícitamente)

**Duda pendiente sin resolver:** en `src/services/api.js` ya existen escritas las funciones `obtenerAuditoria(token)` (`GET /api/auditoria`) y `exportarAuditoriaExcel(token, password)` (`POST /api/auditoria/exportar/excel`), pero **nunca se comprobó si el backend de Laravel realmente las responde** — pueden haber quedado escritas de una fase anterior sin que el endpoint exista todavía del lado del servidor. `src/pages/Auditoria.jsx` hoy es un placeholder ("Próximamente") con un comentario que dice que el backend no expone el endpoint; no sabemos con certeza si ese comentario sigue siendo cierto.

**Primer paso obligatorio (antes de construir la pantalla):** probar el endpoint real. Opciones:
- Iniciar sesión en el sistema y, desde la consola del navegador (con el token ya guardado), hacer `fetch('/api/auditoria', { headers: { Authorization: 'Bearer ' + token } })` y ver qué responde.
- O revisar directamente las rutas del backend Laravel si se tiene acceso al código del servidor.
- O simplemente construir la pantalla apuntando a `obtenerAuditoria` y ver en la práctica si responde datos reales o un 404/500.

**Si el endpoint responde datos reales:** construir `Auditoria.jsx` reutilizando el patrón ya existente de Historial (tabla en escritorio + tarjetas en móvil, mismo `SeccionCard`, mismo `EstadoVacio` para "sin registros"), más el botón de exportar a Excel reutilizando `BotonExcel.jsx` (mismo componente que ya usa Actas) apuntando a `exportarAuditoriaExcel`. Los campos exactos de cada fila (usuario, acción, fecha, detalle, etc.) se ajustan según lo que realmente devuelva `/api/auditoria` — no adivinar la forma de antemano.

**Si el endpoint NO existe todavía:** dejar `Auditoria.jsx` como está (el placeholder actual ya es correcto en ese caso) y avisar que hace falta que el backend lo exponga primero.

## 3. Animación de "presión" (touch/click) en todos los botones -- ✅ HECHO

**Alcance confirmado:** tocar los botones directamente en cada uno de los **29 archivos** que hoy tienen `<button>` (102 botones en total), sin crear un componente `<Boton>` compartido nuevo — se mantiene el estilo actual del código (cada botón con su propia clase de Tailwind).

**Cambio a aplicar por botón:** agregar `active:scale-[0.97] transition-transform` (o el valor de escala que se sienta bien al probarlo, ~0.96–0.98) a la clase de cada `<button>` que no lo tenga ya. Funciona igual con mouse (clic sostenido) y con dedo (touch), porque ambos disparan `:active` en CSS.

**Cómo ejecutarlo en la práctica (para no cometer errores en 102 botones a mano):**
1. Listar los 29 archivos con `<button` (ya se hizo: ver conversación).
2. Recorrer cada archivo, y para cada `<button ... className="...">` verificar si ya tiene algún `active:` de transform/scale; si no lo tiene, añadir `active:scale-[0.97] transition-transform` al final de la clase.
3. Tener cuidado con botones que ya usan `active:brightness-95` u otro `active:` — no reemplazar esos, se pueden combinar (`active:brightness-95 active:scale-[0.97]`).
4. Verificar sintaxis de cada archivo tocado con esbuild antes de guardar (mismo método ya usado en esta sesión).
5. Guardar y probar visualmente unos cuantos botones representativos (uno primario, uno secundario, uno de ícono) antes de dar por terminado.

---

*Este archivo lo puede borrar quien retome el trabajo una vez que el punto 2 (Auditoría) también esté implementado — es solo la bitácora del plan, no documentación permanente del sistema.*
