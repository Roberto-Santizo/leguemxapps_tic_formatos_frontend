import { useParams } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { getFormato } from '../config/formatos.js'
import EnConstruccion from '../components/EnConstruccion.jsx'

/**
 * Placeholder para los cinco formatos del Historial que todavía no tienen
 * endpoint en Laravel (solo "Entrega de Equipo" -- /historial/entrega -- ya
 * está conectado a la API real; ver HistorialEntregaList.jsx). Se retira
 * formato por formato en cuanto el backend exponga cada uno.
 */
function HistorialProximamente() {
  const { tipo } = useParams()
  const formato = getFormato(tipo)

  return (
    <EnConstruccion
      icon={formato?.icon ?? ClipboardList}
      titulo={formato ? formato.tituloCorto : 'Historial de Actas'}
      descripcion={
        formato
          ? `El historial y la búsqueda de "${formato.tituloCorto}" estarán disponibles aquí en cuanto el backend en Laravel exponga sus endpoints.`
          : 'El formato solicitado no existe. Vuelve al Historial de Actas y elige uno de los formatos disponibles.'
      }
    />
  )
}

export default HistorialProximamente
