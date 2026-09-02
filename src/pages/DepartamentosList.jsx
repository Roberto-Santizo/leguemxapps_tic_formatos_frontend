import CatalogoLista from '../components/CatalogoLista.jsx'
import { listarDepartamentos, crearDepartamento, actualizarDepartamento } from '../services/api.js'

// Catálogo de departamentos (GET/POST /departments, PUT /departments/{id}).
// Mismo componente que Marcas: solo cambian textos y funciones de API.
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
  return (
    <CatalogoLista
      textos={TEXTOS}
      onListar={listarDepartamentos}
      onCrear={crearDepartamento}
      onActualizar={actualizarDepartamento}
    />
  )
}

export default DepartamentosList
