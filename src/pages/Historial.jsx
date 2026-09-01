import { ClipboardList } from 'lucide-react'
import EnConstruccion from '../components/EnConstruccion.jsx'

// Página estática temporal: el historial de actas depende del endpoint de
// listado de actas, que todavía no existe en la API de Laravel.
function Historial() {
  return (
    <EnConstruccion
      icon={ClipboardList}
      titulo="Historial de Actas"
      descripcion="El historial y la búsqueda de actas estarán disponibles aquí en cuanto el backend en Laravel exponga los endpoints de actas."
    />
  )
}

export default Historial
