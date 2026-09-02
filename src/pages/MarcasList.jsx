import CatalogoLista from '../components/CatalogoLista.jsx'
import { listarMarcas, crearMarca, actualizarMarca } from '../services/api.js'

// Catálogo de marcas (GET/POST /brands, PUT /brands/{id}).
// Toda la lógica de lista, búsqueda, alta y edición -- y el responsive
// tabla/tarjetas -- vive en CatalogoLista; aquí solo van los textos y las
// funciones de API de esta entidad.
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
}

function MarcasList() {
  return (
    <CatalogoLista
      textos={TEXTOS}
      onListar={listarMarcas}
      onCrear={crearMarca}
      onActualizar={actualizarMarca}
    />
  )
}

export default MarcasList
