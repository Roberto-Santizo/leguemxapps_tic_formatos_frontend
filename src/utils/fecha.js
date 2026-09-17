// Las fechas de entrega/devolución (`delivery_date`, `return_date`) las pone
// el servidor en UTC (ISO 8601, ej. "2026-09-09T23:05:00.000000Z") o, según
// la versión del backend, en formato legible "dd-mm-aaaa hh:mm:ss AM/PM"
// (ej. "14-09-2026 05:09:56 PM") -- que `new Date()` no reconoce y devuelve
// Invalid Date. Todo el sistema es de uso interno en Guatemala, así que
// siempre se muestran convertidas a hora de Guatemala (America/Guatemala,
// UTC-6 fijo, sin horario de verano), nunca la hora UTC cruda del backend.

// Interpreta cualquiera de los dos formatos anteriores y devuelve un Date
// válido (o uno inválido si no se reconoce nada, igual que antes). Las
// fechas guardadas por useFechaLocal.js siguen siendo ISO, así que pasan
// directo por la rama de abajo sin cambios.
function parsearFecha(valor) {
  if (typeof valor === 'string') {
    const coincidencia = valor
      .trim()
      .match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?)?$/i)
    if (coincidencia) {
      const [, dia, mes, anio, horaStr, minStr, segStr, ampm] = coincidencia
      let hora = horaStr ? Number(horaStr) : 0
      if (ampm) {
        const esPM = ampm.toUpperCase() === 'PM'
        if (esPM && hora !== 12) hora += 12
        if (!esPM && hora === 12) hora = 0
      }
      return new Date(Number(anio), Number(mes) - 1, Number(dia), hora, Number(minStr) || 0, Number(segStr) || 0)
    }
  }
  return new Date(valor)
}

/**
 * Formatea un string de fecha/hora ISO del backend a "dd/mm/aaaa HH:mm" en
 * hora de Guatemala. Devuelve '—' si no hay valor o no se puede interpretar.
 */
export function formatearFechaHora(valor) {
  if (!valor) return '—'
  const fecha = parsearFecha(valor)
  if (Number.isNaN(fecha.getTime())) return '—'

  const partes = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(fecha)

  const obtener = (tipo) => partes.find((p) => p.type === tipo)?.value ?? ''
  return `${obtener('day')}/${obtener('month')}/${obtener('year')} ${obtener('hour')}:${obtener('minute')}`
}

/**
 * Igual que formatearFechaHora pero solo la fecha (dd/mm/aaaa), sin hora --
 * para el PDF "papel físico" (Fecha de Entrega / Fecha de Devolución), donde
 * mostrar la hora no tiene sentido en un documento de estilo formal impreso.
 * El Historial en pantalla sigue mostrando fecha y hora completas.
 */
export function formatearFecha(valor) {
  if (!valor) return '—'
  const fecha = parsearFecha(valor)
  if (Number.isNaN(fecha.getTime())) return '—'

  const partes = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(fecha)

  const obtener = (tipo) => partes.find((p) => p.type === tipo)?.value ?? ''
  return `${obtener('day')}/${obtener('month')}/${obtener('year')}`
}

/**
 * Valor "aaaa-mm-dd" (hora de Guatemala) para precargar un
 * `<input type="date">` a partir de un ISO -- usado por EditorFechaLocal
 * (useFechaLocal.js) al abrir el editor con la fecha actual ya seleccionada.
 * Devuelve '' si no hay valor válido, que es lo que un <input type="date">
 * espera para quedar vacío.
 */
export function fechaInputValue(valor) {
  if (!valor) return ''
  const fecha = parsearFecha(valor)
  if (Number.isNaN(fecha.getTime())) return ''

  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(fecha)

  const obtener = (tipo) => partes.find((p) => p.type === tipo)?.value ?? ''
  return `${obtener('year')}-${obtener('month')}-${obtener('day')}`
}

/**
 * Arma la constancia de la Hoja de Devolución ("Por este medio se hace
 * constar que el día ___ del mes ___ del año ___, hago constar que entrego
 * todo el equipo descrito arriba.") con el día/mes/año reales tomados de
 * `return_date`, en vez de dejarlos en blanco para llenar a mano -- son los
 * mismos datos que ya trae el documento, no se pide nada nuevo al backend.
 */
export function constanciaDevolucion(valor) {
  if (!valor) {
    return 'Por este medio se hace constar que hago constar que entrego todo el equipo descrito arriba.'
  }
  const fecha = parsearFecha(valor)
  if (Number.isNaN(fecha.getTime())) {
    return 'Por este medio se hace constar que hago constar que entrego todo el equipo descrito arriba.'
  }

  const partes = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(fecha)

  const obtener = (tipo) => partes.find((p) => p.type === tipo)?.value ?? ''
  return `Por este medio se hace constar que el día ${obtener('day')} del mes de ${obtener('month')} del año ${obtener('year')}, hago constar que entrego todo el equipo descrito arriba.`
}
