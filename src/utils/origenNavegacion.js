import { useLocation } from 'react-router-dom'

// "Volver" que regresa por donde se llegó. Los botones volver apuntaban a una
// ruta fija (p. ej. el detalle de una entrega siempre volvía a Historial /
// Entrega), así que al abrir esa entrega desde el historial de un
// departamento, desde la ficha de un colaborador o desde una devolución,
// "volver" sacaba al usuario de la sección en la que estaba. Ahora quien abre
// la pantalla le pasa su propia ruta en el state de la navegación, y la
// pantalla la usa; si no la trae (URL directa, recarga, menú) se queda la ruta
// fija de siempre.
//
//   navigate(`/historial/entrega/${id}`, { state: conOrigen(location, 'Juan Pérez') })
//   const origen = useOrigen('/historial/entrega', 'Entrega de Equipo')
//   <Link to={origen.ruta} state={origen.estado}>{origen.etiqueta}</Link>

/** State de navegación con la pantalla actual como origen. */
export function conOrigen(location, etiqueta) {
  return { origen: { ruta: `${location.pathname}${location.search}`, etiqueta } }
}

// Solo rutas internas: el state lo puede escribir cualquier navegación.
function rutaValida(ruta) {
  return typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//')
}

/**
 * { ruta, etiqueta, estado } de "volver". `estado` es el state recibido, para
 * reenviarlo a una pantalla hija que vuelve aquí (p. ej. registrar devolución
 * → entrega): así al volver a esta pantalla sigue sabiendo su propio origen.
 */
export function useOrigen(rutaPorDefecto, etiquetaPorDefecto) {
  const { state } = useLocation()
  const origen = state?.origen
  if (origen && rutaValida(origen.ruta)) {
    return { ruta: origen.ruta, etiqueta: origen.etiqueta || etiquetaPorDefecto, estado: state, propio: true }
  }
  return { ruta: rutaPorDefecto, etiqueta: etiquetaPorDefecto, estado: null, propio: false }
}
