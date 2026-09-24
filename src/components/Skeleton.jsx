/**
 * Barras fantasma para la primera carga de una lista.
 *
 * Sustituyen a la rueda girando centrada: al tener la misma forma y el mismo
 * alto que la fila (o la tarjeta) real, el contenido no "salta" cuando llegan
 * los datos. La rueda se queda solo donde sí aporta: dentro de un botón
 * mientras se envía algo.
 *
 * Solo para la carga inicial contra la API. Al filtrar con el buscador NO se
 * usan: ese filtrado es en cliente y es instantáneo.
 *
 * `motion-reduce:animate-none` respeta la misma preferencia del sistema que ya
 * respeta animate-view-in.
 *
 * Sistema "Sierra": en vez del parpadeo (pulse) se usa el brillo que recorre
 * la barra del mockup (keyframe `shimmer`: degradado #f5f5f5 → #e5e5e5 →
 * #f5f5f5 de 200% de ancho que se desplaza), y los contenedores son las
 * mismas tarjetas blancas (rounded-tarjeta + shadow-tarjeta) que el contenido
 * real, para que no cambie el marco al llegar los datos.
 */

const barra =
  'animate-shimmer motion-reduce:animate-none rounded-md bg-gradient-to-r from-surface-container via-surface-container-highest to-surface-container bg-[length:200%_100%]'

// Anchos variados para que no parezca una rejilla perfecta (eso delata que es
// un placeholder y se lee peor que un ritmo irregular).
const ANCHOS = ['w-2/5', 'w-3/5', 'w-1/3', 'w-1/2', 'w-2/3']

/**
 * Filas fantasma con el alto de una fila de tabla (px-5 py-4 + texto), para
 * meter dentro del mismo contenedor donde va la <table>.
 */
export function SkeletonTabla({ columnas = 4, filas = 5 }) {
  return (
    <div className="divide-y divide-outline-variant" aria-hidden="true">
      {Array.from({ length: filas }).map((_, fila) => (
        <div key={fila} className="flex h-[72px] items-center gap-6 px-4">
          {Array.from({ length: columnas }).map((_, columna) => (
            <div key={columna} className={`${barra} h-3.5 ${ANCHOS[(fila + columna) % ANCHOS.length]} flex-1`} />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Tarjetas fantasma con el alto de las tarjetas móviles (px-4 py-3.5, dos
 * líneas: título + línea de apoyo).
 */
export function SkeletonTarjetas({ filas = 4 }) {
  return (
    <div className="flex flex-col gap-stack-sm" aria-hidden="true">
      {Array.from({ length: filas }).map((_, fila) => (
        <div
          key={fila}
          className="rounded-tarjeta bg-white p-4 shadow-tarjeta"
        >
          <div className={`${barra} h-4 ${ANCHOS[fila % ANCHOS.length]}`} />
          <div className={`${barra} mt-2.5 h-3 w-1/4`} />
        </div>
      ))}
    </div>
  )
}

/**
 * Fantasma con forma de sección de formulario (tarjeta + label/input
 * apilados), para reemplazar la rueda girando centrada en las páginas de
 * alta/edición (EquipoForm, EmpleadoForm, CatalogoFormPage) mientras se
 * obtiene el registro a editar.
 */
export function SkeletonFormulario({ campos = 4 }) {
  return (
    <div
      className="flex flex-col gap-5 rounded-tarjeta bg-white p-4 shadow-tarjeta sm:p-6"
      aria-hidden="true"
    >
      {Array.from({ length: campos }).map((_, campo) => (
        <div key={campo} className="flex flex-col gap-2">
          <div className={`${barra} h-3 w-28`} />
          <div className={`${barra} h-10 w-full rounded-boton`} />
        </div>
      ))}
    </div>
  )
}

/**
 * Fantasma con forma de vista de detalle (una o más tarjetas de sección con
 * pares etiqueta/valor), para EquipoView, CatalogoRegistroView e Historial
 * (Entrega/Devolución) mientras se obtiene el registro.
 */
export function SkeletonDetalle({ secciones = 1, camposPorSeccion = 4 }) {
  return (
    <div className="flex flex-col gap-stack-md" aria-hidden="true">
      {Array.from({ length: secciones }).map((_, seccion) => (
        <div
          key={seccion}
          className="rounded-tarjeta bg-white p-4 shadow-tarjeta sm:p-6"
        >
          <div className={`${barra} mb-5 h-4 w-40`} />
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {Array.from({ length: camposPorSeccion }).map((_, campo) => (
              <div key={campo} className="flex flex-col gap-1.5">
                <div className={`${barra} h-3 ${ANCHOS[(seccion + campo) % ANCHOS.length]}`} />
                <div className={`${barra} h-3.5 w-3/4`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SkeletonTabla
