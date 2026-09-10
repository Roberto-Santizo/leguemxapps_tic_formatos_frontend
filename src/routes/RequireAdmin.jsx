import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Ahora solo hay dos roles (admin / user); "user" queda restringido a
// Historial, así que el destino de rebote NO puede ser "/" -- esa ruta
// también es admin-only y causaría un loop de redirección. "/historial" sí
// es la única zona a la que "user" siempre tiene acceso.
function RequireAdmin({ children }) {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return <Navigate to="/historial" replace />
  }

  return children
}

export default RequireAdmin
