import { ShieldCheck } from 'lucide-react'
import EnConstruccion from '../components/EnConstruccion.jsx'

// Página estática temporal: la auditoría depende de un endpoint que todavía
// no existe en la API de Laravel.
function Auditoria() {
  return (
    <EnConstruccion
      icon={ShieldCheck}
      titulo="Auditoría"
      descripcion="El registro de auditoría estará disponible aquí en cuanto el backend en Laravel exponga ese endpoint."
    />
  )
}

export default Auditoria
