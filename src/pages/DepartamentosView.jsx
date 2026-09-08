import CatalogoRegistroView from '../components/CatalogoRegistroView.jsx'
import { obtenerDepartamento } from '../services/api.js'

const TEXTOS = {
  titulo: 'Departamentos',
  tituloEditar: 'Editar departamento',
  colNombre: 'Departamento',
}

function DepartamentosView() {
  return (
    <CatalogoRegistroView textos={TEXTOS} onObtener={obtenerDepartamento} rutaBase="/catalogo/departamentos" />
  )
}

export default DepartamentosView
