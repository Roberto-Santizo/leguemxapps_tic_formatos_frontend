import CatalogoFormPage from '../components/CatalogoFormPage.jsx'
import { obtenerDepartamento, crearDepartamento, actualizarDepartamento } from '../services/api.js'

const TEXTOS = {
  titulo: 'Departamentos',
  tituloCrear: 'Nuevo departamento',
  tituloEditar: 'Editar departamento',
  labelCampo: 'Nombre del departamento',
  placeholderCampo: 'Ej. Recursos Humanos',
}

function DepartamentosForm() {
  return (
    <CatalogoFormPage
      textos={TEXTOS}
      onObtener={obtenerDepartamento}
      onCrear={crearDepartamento}
      onActualizar={actualizarDepartamento}
      rutaBase="/catalogo/departamentos"
    />
  )
}

export default DepartamentosForm
