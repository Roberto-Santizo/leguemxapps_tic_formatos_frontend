import { Tag } from 'lucide-react'
import CatalogoLista from '../components/CatalogoLista.jsx'
import { listarMarcas } from '../services/api.js'

// Catálogo de marcas (GET /brands). Alta y edición viven en su propia
// página -- ver MarcasForm.jsx y MarcasView.jsx.
const TEXTOS = {
  titulo: 'Marcas',
  subtitulo: 'Fabricantes disponibles al llenar la columna Marca de un acta.',
  colNombre: 'Marca',
  plural: 'marcas',
  textoCrear: 'Nueva marca',
  placeholderBusqueda: 'Buscar marca...',
  tituloCrear: 'Nueva marca',
  tituloEditar: 'Editar marca',
  labelCampo: 'Nombre de la marca',
  placeholderCampo: 'Ej. Dell',
  vacioTitulo: 'Aún no hay marcas registradas',
  vacioTexto: 'Crea la primera para que aparezca al llenar las actas.',
  // Mismo ícono que la tarjeta de Catálogo desde la que se entra.
  icono: Tag,
}

function MarcasList() {
  return <CatalogoLista textos={TEXTOS} onListar={listarMarcas} rutaBase="/catalogo/marcas" />
}

export default MarcasList
