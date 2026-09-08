import CatalogoRegistroView from '../components/CatalogoRegistroView.jsx'
import { obtenerMarca } from '../services/api.js'

const TEXTOS = {
  titulo: 'Marcas',
  tituloEditar: 'Editar marca',
  colNombre: 'Marca',
}

function MarcasView() {
  return <CatalogoRegistroView textos={TEXTOS} onObtener={obtenerMarca} rutaBase="/catalogo/marcas" />
}

export default MarcasView
