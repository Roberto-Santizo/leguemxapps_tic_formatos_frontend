import { useCallback, useMemo } from 'react'
import { usePaginaUrl } from './usePaginacion.js'
import { fechaInputValue } from '../utils/fecha.js'
import { normalizarNombre } from '../utils/texto.js'
import { OPCIONES_ESTADO_ENTREGA } from '../utils/estadoEntrega.js'

// 'aaaa-mm-dd' que además exista en el calendario: "2026-13-45" (a mano en
// la URL) se ignora en vez de filtrar con un campo de fecha que se ve vacío.
function fechaValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const [a, m, d] = valor.split('-').map(Number)
  const f = new Date(Date.UTC(a, m - 1, d))
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d
}

export const OPCIONES_PLANTA = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'tejar', etiqueta: 'Tejar' },
  { valor: 'parramos', etiqueta: 'Parramos' },
]

// `location` llega como 1 / 2 o ya como nombre ("Planta Tejar"), igual que
// en nombrePlanta() de HistorialEntregaList.
function plantaDe(location) {
  if (location === 'Planta Tejar') return 'tejar'
  if (location === 'Planta Parramos') return 'parramos'
  return Number(location) === 1 ? 'tejar' : 'parramos'
}

/**
 * Filtros de las listas de actas, con su estado en la URL
 * (`?estado=parcial&planta=tejar&desde=2026-09-01&hasta=2026-09-30`), para que
 * refrescar o compartir el enlace conserve lo que se está viendo.
 *
 *  - campoEstado: 'status' (entregas) o 'delivery_document_status' (devoluciones).
 *  - campoFecha: 'delivery_date' o 'return_date'.
 *  - conPlanta: solo las entregas traen `location`.
 *  - departamento: undefined fuera del historial por departamento; null
 *    mientras el departamento se está cargando (no deja pasar nada, para que
 *    nunca se vea un instante el historial de todos); { name } ya cargado.
 *
 * Devuelve `filtroExtra` listo para useListaPaginada (null si no hay ningún
 * filtro activo, así la lista sigue pidiéndose por página al servidor) y las
 * props de <FiltrosActas />.
 */
export default function useFiltrosActas({ campoEstado, campoFecha, conPlanta = false, departamento }) {
  const { parametro, setParametro, setParametros } = usePaginaUrl()

  const estadoUrl = parametro('estado')
  const estado = OPCIONES_ESTADO_ENTREGA.some((o) => o.valor === estadoUrl) ? estadoUrl : ''
  const plantaUrl = parametro('planta')
  const planta = conPlanta && OPCIONES_PLANTA.some((o) => o.valor === plantaUrl) ? plantaUrl : ''
  const desde = fechaValida(parametro('desde')) ? parametro('desde') : ''
  const hasta = fechaValida(parametro('hasta')) ? parametro('hasta') : ''

  const enDepartamento = departamento !== undefined
  const nombreDepto = departamento ? normalizarNombre(departamento.name) : ''

  const filtroExtra = useMemo(() => {
    if (enDepartamento && !departamento) return () => false
    const partes = []
    if (nombreDepto) partes.push((d) => normalizarNombre(d.employee_department) === nombreDepto)
    if (estado) partes.push((d) => d[campoEstado] === estado)
    if (planta) partes.push((d) => plantaDe(d.location) === planta)
    if (desde || hasta) {
      // Rango al revés (desde > hasta) se interpreta en el orden correcto en
      // vez de dejar la lista vacía sin explicación.
      const [a, b] = desde && hasta && desde > hasta ? [hasta, desde] : [desde, hasta]
      partes.push((d) => {
        const f = fechaInputValue(d[campoFecha])
        if (!f) return false
        return (!a || f >= a) && (!b || f <= b)
      })
    }
    return partes.length ? (d) => partes.every((p) => p(d)) : null
  }, [enDepartamento, departamento, nombreDepto, estado, planta, desde, hasta, campoEstado, campoFecha])

  const hayFiltros = Boolean(estado || planta || desde || hasta)
  const limpiar = useCallback(
    () => setParametros({ estado: '', planta: '', desde: '', hasta: '' }),
    [setParametros],
  )

  const grupos = [
    {
      id: 'estado',
      etiqueta: 'Estado',
      valor: estado,
      opciones: OPCIONES_ESTADO_ENTREGA,
      onCambiar: (v) => setParametro('estado', v),
    },
    ...(conPlanta
      ? [{ id: 'planta', etiqueta: 'Planta', valor: planta, opciones: OPCIONES_PLANTA, onCambiar: (v) => setParametro('planta', v) }]
      : []),
  ]

  return {
    filtroExtra,
    hayFiltros,
    propsFiltros: {
      grupos,
      desde,
      hasta,
      onDesde: (v) => setParametro('desde', v),
      onHasta: (v) => setParametro('hasta', v),
      hayFiltros,
      onLimpiar: limpiar,
    },
    limpiarFiltros: limpiar,
  }
}
