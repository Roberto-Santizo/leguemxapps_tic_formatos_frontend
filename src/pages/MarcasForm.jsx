import CatalogoFormPage from '../components/CatalogoFormPage.jsx'
import { obtenerMarca, crearMarca, actualizarMarca } from '../services/api.js'

const TEXTOS = {
  titulo: 'Marcas',
  tituloCrear: 'Nueva marca',
  tituloEditar: 'Editar marca',
  labelCampo: 'Nombre de la marca',
  placeholderCampo: 'Ej. Dell',
}

function MarcasForm() {
  return (
    <CatalogoFormPage
      textos={TEXTOS}
      onObtener={obtenerMarca}
      onCrear={crearMarca}
      onActualizar={actualizarMarca}
      rutaBase="/catalogo/marcas"
    />
  )
}

export default MarcasForm
