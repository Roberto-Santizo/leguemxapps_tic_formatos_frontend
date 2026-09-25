import { useCallback, useRef, useState } from 'react'
import { listarEquipos } from '../services/api.js'
import { mostrarToast } from '../components/Toast.jsx'
import { equipoPorSerie, idDirectoDelRenglon, serieComparable } from '../utils/equipoDeRenglon.js'

/**
 * Ficha del equipo (EquipoDetalleModal) desde un renglón de un acta ya
 * registrada -- el ojo de cada equipo en HistorialEntregaView y
 * HistorialDevolucionView.
 *
 * El renglón es el DETALLE del acta, no el equipo: se usa su `equipment_id`
 * si el backend lo manda. Si no viene, se busca el equipo por su serie en el
 * catálogo (GET /equipments completo, que sí trae id y serie; se pide una vez
 * y se reutiliza). Si hubiera dos con la misma serie, desempata el nombre.
 *
 *   const ficha = useFichaEquipo(token)
 *   ficha.abrirDeItem(item)       -- ojo de un renglón
 *   ficha.setEquipoId(id)         -- ojo del selector "Agregar equipo"
 *   <EquipoDetalleModal equipoId={ficha.equipoId} onCerrar={ficha.cerrar} ... />
 *   ficha.buscandoItem            -- id del renglón que se está resolviendo
 *   ficha.olvidarCatalogo()       -- tras editar un equipo (pudo cambiar su serie)
 */
export default function useFichaEquipo(token) {
  const [equipoId, setEquipoId] = useState('')
  const [buscandoItem, setBuscandoItem] = useState(null)
  const catalogo = useRef(null)

  const abrirDeItem = useCallback(
    async (item) => {
      const directo = idDirectoDelRenglon(item)
      if (directo) {
        setEquipoId(String(directo))
        return
      }
      const serie = serieComparable(item?.equipment_serie)
      if (!serie) {
        mostrarToast('Este equipo no tiene serie registrada para abrir su ficha', { tipo: 'error' })
        return
      }
      setBuscandoItem(item.id)
      try {
        if (!catalogo.current) {
          const lista = await listarEquipos(token)
          catalogo.current = Array.isArray(lista) ? lista : []
        }
        const equipo = equipoPorSerie(catalogo.current, item)
        if (equipo) setEquipoId(String(equipo.id))
        else mostrarToast('No se encontró la ficha de este equipo en el catálogo', { tipo: 'error' })
      } catch (err) {
        mostrarToast(err.message || 'No se pudo abrir la ficha del equipo', { tipo: 'error' })
      } finally {
        setBuscandoItem(null)
      }
    },
    [token],
  )

  const cerrar = useCallback(() => setEquipoId(''), [])
  const olvidarCatalogo = useCallback(() => {
    catalogo.current = null
  }, [])

  return { equipoId, setEquipoId, abrirDeItem, cerrar, buscandoItem, olvidarCatalogo }
}
