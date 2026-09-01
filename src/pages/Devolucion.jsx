import { FileInput } from 'lucide-react'
import EnConstruccion from '../components/EnConstruccion.jsx'

// Página estática temporal: el módulo de Hoja de Devolución (crear/editar
// actas, firmas, PDF) todavía no tiene endpoints en la API de Laravel, así
// que no se hace ninguna llamada a un backend que aún no existe. Cuando
// existan esos endpoints, esta pantalla se reconstruye con el formulario
// real.
function Devolucion() {
  return (
    <EnConstruccion
      icon={FileInput}
      titulo="Hoja de Devolución"
      descripcion="El registro de hojas de devolución estará disponible aquí en cuanto el backend en Laravel exponga los endpoints de actas."
    />
  )
}

export default Devolucion
