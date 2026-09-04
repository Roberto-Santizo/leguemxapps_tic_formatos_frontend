import CatalogoLista from '../components/CatalogoLista.jsx'
import { listarDepartamentos } from '../services/api.js'

// Catálogo de departamentos (GET /departments). Alta y edición viven en su
// propia página -- ver DepartamentosForm.jsx y DepartamentosView.jsx.
const TEXTOS = {
  titulo: 'Departamentos',
  subtitulo: 'Áreas de la empresa que se asignan al colaborador en cada acta.',
  colNombre: 'Departamento',
  plural: 'departamentos',
  textoCrear: 'Nuevo departamento',
  placeholderBusqueda: 'Buscar departamento...',
  tituloCrear: 'Nuevo departamento',
  tituloEditar: 'Editar departamento',
  labelCampo: 'Nombre del departamento',
  placeholderCampo: 'Ej. Recursos Humanos',
  vacioTitulo: 'Aún no hay departamentos registrados',
  vacioTexto: 'Crea el primero para que aparezca al llenar las actas.',
}

function DepartamentosList() {
  return <CatalogoLista textos={TEXTOS} onListar={listarDepartamentos} rutaBase="/catalogo/departamentos" />
}

export default DepartamentosList
