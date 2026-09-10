const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Backend nuevo (Laravel) -- de momento solo se usa para el login. El resto
// de endpoints (actas, auditoria, usuarios, etc.) siguen apuntando a API_URL
// hasta que se migren uno por uno.
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://192.168.10.209:8000/api'

async function request(path, options = {}) {
  const url = `${API_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  let data = null
  try {
    data = await response.json()
  } catch (_) {
    // respuesta sin cuerpo JSON
  }

  if (!response.ok) {
    const message = (data && data.message) || `Error ${response.status}`
    const error = new Error(message)
    // Fase F: se adjunta el status HTTP para que las pantallas puedan
    // distinguir un 409 (conflicto de concurrencia -- alguien más editó el
    // mismo registro) de otros errores y mostrar un mensaje específico.
    error.status = response.status
    throw error
  }

  return data
}

export async function checkApiHealth() {
  return request('/api/health', { method: 'GET' })
}

// Llama con el token guardado en el header Authorization: Bearer <token>
function authRequest(path, token, options = {}) {
  return request(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

// Pega contra el backend Laravel (Legumex TIC Formatos API), desenvolviendo
// su formato de respuesta { statusCode, message, data }. En error (4xx/5xx)
// lanza un Error con .status y, si Laravel mandó validación 422, .errors =
// { campo: ['mensaje', ...] }.
export async function laravelRequest(path, { token, ...options } = {}) {
  const response = await fetch(`${AUTH_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  let body = null
  try {
    body = await response.json()
  } catch (_) {
    // respuesta sin cuerpo JSON
  }

  if (!response.ok || !body) {
    const message = (body && body.message) || `Error ${response.status}`
    const error = new Error(message)
    error.status = response.status
    if (body && body.errors) error.errors = body.errors
    throw error
  }

  return body.data
}

// Variante de laravelRequest para envíos multipart/form-data (archivos +
// campos) -- necesaria para POST /delivery_documents, que recibe las dos
// firmas como archivo. A propósito NO se fija 'Content-Type': el navegador
// arma el boundary del multipart solo; si se fija a mano, no puede
// completarlo y la petición llega rota. El resto (desenvolver
// { statusCode, message, data }, armar Error con .status/.errors) es igual
// que laravelRequest.
async function laravelRequestMultipart(path, { token, formData, method = 'POST' } = {}) {
  const response = await fetch(`${AUTH_API_URL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  let body = null
  try {
    body = await response.json()
  } catch (_) {
    // respuesta sin cuerpo JSON
  }

  if (!response.ok || !body) {
    const message = (body && body.message) || `Error ${response.status}`
    const error = new Error(message)
    error.status = response.status
    if (body && body.errors) error.errors = body.errors
    throw error
  }

  return body.data
}

// Login contra el backend Laravel.
// A diferencia del backend viejo, no regresa id ni username del usuario --
// solo name, role y el token JWT -- así que armamos "user" combinando eso
// con el username que la persona escribió en el formulario.
export async function login(username, password) {
  const data = await laravelRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

  return {
    token: data.token,
    user: {
      username,
      name: data.name,
      role: data.role,
    },
  }
}

// Renueva el token contra GET /check-status (protegido). No se usa todavía
// en la app -- se deja lista para cuando se implemente la renovación
// automática de sesión.
export async function checkStatus(token) {
  return laravelRequest('/check-status', { token, method: 'GET' })
}

// Registrar un usuario nuevo contra POST /register (solo admin). Devuelve
// { id, name, username, role } -- Laravel nunca regresa la contraseña ni
// emite token: el usuario creado debe iniciar sesión aparte.
export async function registrarUsuario(token, { name, username, password, password_confirmation, role }) {
  return laravelRequest('/register', {
    token,
    method: 'POST',
    body: JSON.stringify({ name, username, password, password_confirmation, role }),
  })
}

export async function crearActa(token, payload) {
  return authRequest('/api/actas', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function guardarFirma(token, actaId, tipo, imagenBase64) {
  return authRequest(`/api/actas/${actaId}/firma`, token, {
    method: 'POST',
    body: JSON.stringify({ tipo, imagen_base64: imagenBase64 }),
  })
}

export async function reiniciarFirma(token, actaId, tipo, password) {
  return authRequest(`/api/actas/${actaId}/firma`, token, {
    method: 'DELETE',
    body: JSON.stringify({ tipo, password }),
  })
}

export async function listarActas(token) {
  return authRequest('/api/actas', token, { method: 'GET' })
}

export async function obtenerActa(token, id) {
  return authRequest(`/api/actas/${id}`, token, { method: 'GET' })
}

export async function editarActa(token, id, payload) {
  return authRequest(`/api/actas/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function eliminarActa(token, id, password) {
  return authRequest(`/api/actas/${id}`, token, {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  })
}

// El PDF requiere el header Authorization, así que no se puede abrir con un
// simple <a href>; hay que pedirlo con fetch y convertir la respuesta a blob.
export async function descargarPdfActa(token, id) {
  const response = await fetch(`${API_URL}/api/actas/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    let message = `Error ${response.status}`
    try {
      const data = await response.json()
      message = data.message || message
    } catch (_) {
      // el error no vino en JSON
    }
    throw new Error(message)
  }
  return response.blob()
}

export async function obtenerAuditoria(token) {
  return authRequest('/api/auditoria', token, { method: 'GET' })
}

// Gestión de usuarios (panel admin, jwt.auth + admin). Antes estas 3
// funciones llamaban a /api/usuarios contra el backend viejo (authRequest ->
// API_URL) que nunca se conectó a esta pantalla -- se corrigen para usar el
// backend real (laravelRequest -> AUTH_API_URL), igual que registrarUsuario.
export async function listarUsuarios(token) {
  return laravelRequest('/users', { token, method: 'GET' })
}

export async function obtenerUsuario(token, id) {
  return laravelRequest(`/users/${id}`, { token, method: 'GET' })
}

export async function crearUsuario(token, payload) {
  return laravelRequest('/users', {
    token,
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// `password` es opcional al editar: si se omite, el usuario conserva la
// contraseña que ya tenía (así lo documenta la API) -- quien llama a esta
// función decide si la incluye en `payload` o no.
export async function editarUsuario(token, id, payload) {
  return laravelRequest(`/users/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function eliminarUsuario(token, id) {
  return authRequest(`/api/usuarios/${id}`, token, { method: 'DELETE' })
}

// Descargas de Excel (Fase 8): igual que el PDF, requieren el header
// Authorization, así que se piden con fetch y se convierten a blob. Además
// van con POST + contraseña en el body (ConfirmModal), nunca en la URL.
async function descargarExcel(path, token, password) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  })
  if (!response.ok) {
    let message = `Error ${response.status}`
    try {
      const data = await response.json()
      message = data.message || message
    } catch (_) {
      // el error no vino en JSON
    }
    throw new Error(message)
  }
  return response.blob()
}

export async function exportarActasExcel(token, password) {
  return descargarExcel('/api/actas/exportar/excel', token, password)
}

export async function exportarAuditoriaExcel(token, password) {
  return descargarExcel('/api/auditoria/exportar/excel', token, password)
}

// ---------------------------------------------------------------------------
// Catálogo (Laravel): marcas y departamentos.
// Las rutas /brands y /departments solo exigen jwt.auth -- no piden rol admin,
// así que cualquier usuario autenticado puede listarlas y editarlas.
// Se usa laravelRequest (igual que login/registrarUsuario) porque viven en el
// backend nuevo, no en API_URL.
// ---------------------------------------------------------------------------

export async function listarMarcas(token) {
  return laravelRequest('/brands', { token, method: 'GET' })
}

export async function crearMarca(token, { name }) {
  return laravelRequest('/brands', {
    token,
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function obtenerMarca(token, id) {
  return laravelRequest(`/brands/${id}`, { token, method: 'GET' })
}

export async function actualizarMarca(token, id, { name }) {
  return laravelRequest(`/brands/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

export async function listarDepartamentos(token) {
  return laravelRequest('/departments', { token, method: 'GET' })
}

export async function crearDepartamento(token, { name }) {
  return laravelRequest('/departments', {
    token,
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function obtenerDepartamento(token, id) {
  return laravelRequest(`/departments/${id}`, { token, method: 'GET' })
}

export async function actualizarDepartamento(token, id, { name }) {
  return laravelRequest(`/departments/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

// ---------------------------------------------------------------------------
// Equipos y Características (Laravel). Igual que /brands y /departments:
// solo exigen jwt.auth, sin rol. Se usa el mismo helper `laravelRequest`.
//
// Ojo con dos detalles de la API documentada:
//  1. GET /equipments devuelve una vista REDUCIDA: { id, name, brand, registeredBy }.
//     No trae model / serie / type / brand_id, así que para editar hay que
//     pedir GET /equipments/{id}.
//  2. GET /caracteristics también es reducido: { id, name, equipment } -- sin
//     `description`. Para mostrar "Nombre: Descripción" hay que pedir el
//     detalle de cada una. Eso hace `obtenerCaracteristicasDeEquipo`.
// ---------------------------------------------------------------------------

export async function listarEquipos(token) {
  return laravelRequest('/equipments', { token, method: 'GET' })
}

// Equipo sin entrega activa (nunca entregado, o su última entrega ya se
// devolvió) -- es la lista correcta para elegir equipo al armar una entrega
// nueva o al agregar uno a una ya existente, en vez de listarEquipos (que
// trae TODO el inventario, incluido lo que ya está en manos de alguien).
export async function listarEquiposDisponibles(token, { type, search } = {}) {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (search) params.set('search', search)
  const query = params.toString()
  return laravelRequest(`/equipments/available${query ? `?${query}` : ''}`, { token, method: 'GET' })
}

// Historial de a quién se le ha entregado un equipo y si ya lo devolvió,
// de la más reciente a la más antigua.
export async function historialEquipo(token, id) {
  return laravelRequest(`/equipments/${id}/history`, { token, method: 'GET' })
}

export async function obtenerEquipo(token, id) {
  return laravelRequest(`/equipments/${id}`, { token, method: 'GET' })
}

export async function crearEquipo(token, payload) {
  return laravelRequest('/equipments', {
    token,
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function actualizarEquipo(token, id, payload) {
  return laravelRequest(`/equipments/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// Listado reducido de características. Sin `equipmentId` trae todas: se usa
// una sola vez al cargar la pantalla para saber qué equipos tienen o no
// características (Estado A / Estado B) sin pedir un detalle por fila.
export async function listarCaracteristicas(token, equipmentId) {
  const query = equipmentId ? `?equipmentId=${equipmentId}` : ''
  return laravelRequest(`/caracteristics${query}`, { token, method: 'GET' })
}

export async function obtenerCaracteristica(token, id) {
  return laravelRequest(`/caracteristics/${id}`, { token, method: 'GET' })
}

export async function crearCaracteristica(token, { name, description, equipment_id }) {
  return laravelRequest('/caracteristics', {
    token,
    method: 'POST',
    body: JSON.stringify({ name, description, equipment_id }),
  })
}

export async function actualizarCaracteristica(token, id, { name, description, equipment_id }) {
  return laravelRequest(`/caracteristics/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify({ name, description, equipment_id }),
  })
}

// Características COMPLETAS (con descripción) de un equipo. El listado no
// trae `description`, así que se pide el detalle de cada id en paralelo.
export async function obtenerCaracteristicasDeEquipo(token, equipmentId) {
  const reducidas = await listarCaracteristicas(token, equipmentId)
  const lista = Array.isArray(reducidas) ? reducidas : []
  if (lista.length === 0) return []
  return Promise.all(lista.map((c) => obtenerCaracteristica(token, c.id)))
}

// ---------------------------------------------------------------------------
// Empleados (Laravel): GET/POST /employees, PUT /employees/{id}. Mismo
// candado que Marcas/Departamentos/Equipos: jwt.auth, sin rol.
//
// Avisos de la API, iguales a los de Equipos:
//  - El POST no devuelve el registro completo (sin id ni fechas): tras crear
//    hay que recargar la lista con listarEmpleados, no confiar en la
//    respuesta del POST.
//  - PUT exige los tres campos siempre (code, name, department_id), aunque
//    el usuario solo cambie uno -- el formulario de edición reenvía todo lo
//    precargado.
// ---------------------------------------------------------------------------

export async function listarEmpleados(token) {
  return laravelRequest('/employees', { token, method: 'GET' })
}

export async function obtenerEmpleado(token, id) {
  return laravelRequest(`/employees/${id}`, { token, method: 'GET' })
}

export async function crearEmpleado(token, { code, name, department_id }) {
  return laravelRequest('/employees', {
    token,
    method: 'POST',
    body: JSON.stringify({ code, name, department_id }),
  })
}

export async function actualizarEmpleado(token, id, { code, name, department_id }) {
  return laravelRequest(`/employees/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify({ code, name, department_id }),
  })
}

// ---------------------------------------------------------------------------
// Documentos de Entrega (Laravel): GET/POST /delivery_documents,
// GET/DELETE /delivery_documents/{id}. Mismo candado que el resto: jwt.auth,
// sin rol. El usuario autenticado queda registrado en user_id y la fecha de
// entrega la pone el servidor -- ninguno de los dos se manda en el cuerpo.
//
// El alta es multipart/form-data (las dos firmas van como archivo), por eso
// usa laravelRequestMultipart en vez de laravelRequest. Los equipos
// entregados viajan como items[i][equipment_id] / items[i][observations]
// dentro del mismo FormData -- quien arma ese FormData es FormatoActa.jsx.
//
// El POST no devuelve el documento creado (data: true); para leerlo hay que
// pedir obtenerDocumentoEntrega con el listado recargado.
// ---------------------------------------------------------------------------

export async function listarDocumentosEntrega(token) {
  return laravelRequest('/delivery_documents', { token, method: 'GET' })
}

export async function obtenerDocumentoEntrega(token, id) {
  return laravelRequest(`/delivery_documents/${id}`, { token, method: 'GET' })
}

export async function crearDocumentoEntrega(token, formData) {
  return laravelRequestMultipart('/delivery_documents', { token, formData, method: 'POST' })
}

export async function eliminarDocumentoEntrega(token, id) {
  return laravelRequest(`/delivery_documents/${id}`, { token, method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// Detalles de Documento de Entrega (delivery_document_details): mantenimiento
// sobre una entrega YA creada -- agregar un equipo que se quedó fuera,
// corregir la observación de uno ya entregado, o quitar un renglón que se
// agregó por error. La creación normal de una entrega (con todos sus
// equipos de una vez) sigue yendo por crearDocumentoEntrega; esto es solo
// para editar después.
//
// El filtro `pending` (GET) deja solo los detalles sin devolución
// registrada -- es la lista que usa la pantalla de Devolución para saber
// qué sigue pendiente de esa entrega.
// ---------------------------------------------------------------------------

export async function listarDetallesEntrega(token, { deliveryDocumentId, equipmentId, pending } = {}) {
  const params = new URLSearchParams()
  if (deliveryDocumentId != null) params.set('deliveryDocumentId', deliveryDocumentId)
  if (equipmentId != null) params.set('equipmentId', equipmentId)
  if (pending) params.set('pending', 'true')
  const query = params.toString()
  return laravelRequest(`/delivery_document_details${query ? `?${query}` : ''}`, { token, method: 'GET' })
}

export async function agregarDetalleEntrega(token, { delivery_document_id, equipment_id, observations }) {
  return laravelRequest('/delivery_document_details', {
    token,
    method: 'POST',
    body: JSON.stringify({ delivery_document_id, equipment_id, observations }),
  })
}

// Solo corrige la observación: cambiar equipo o documento equivale a
// rehacer la entrega (regla de la API).
export async function actualizarDetalleEntrega(token, id, { observations }) {
  return laravelRequest(`/delivery_document_details/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify({ observations }),
  })
}

// Borrado definitivo (sin soft delete) -- la pantalla debe confirmar antes.
export async function eliminarDetalleEntrega(token, id) {
  return laravelRequest(`/delivery_document_details/${id}`, { token, method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// Documentos de Devolución (Laravel): GET/POST /return_documents,
// GET/PUT /return_documents/{id}. Una devolución siempre nace de una entrega
// (delivery_document_id) y puede ser parcial -- solo se envían los equipos
// que regresan. Mismo candado que el resto: jwt.auth, sin rol. El usuario
// autenticado queda en user_id y la fecha (return_date) la pone el servidor.
//
// El alta es multipart/form-data porque lleva las dos firmas como archivo
// (igual que crearDocumentoEntrega); cada item apunta al
// delivery_document_detail_id de la entrega original, no al equipment_id.
// El POST no devuelve el documento creado (data: true); para leerlo hay que
// pedir obtenerDocumentoDevolucion aparte.
// ---------------------------------------------------------------------------

export async function listarDocumentosDevolucion(token, { deliveryDocumentId, employeeId } = {}) {
  const params = new URLSearchParams()
  if (deliveryDocumentId != null) params.set('deliveryDocumentId', deliveryDocumentId)
  if (employeeId != null) params.set('employeeId', employeeId)
  const query = params.toString()
  return laravelRequest(`/return_documents${query ? `?${query}` : ''}`, { token, method: 'GET' })
}

export async function obtenerDocumentoDevolucion(token, id) {
  return laravelRequest(`/return_documents/${id}`, { token, method: 'GET' })
}

export async function crearDocumentoDevolucion(token, formData) {
  return laravelRequestMultipart('/return_documents', { token, formData, method: 'POST' })
}

// Solo corrige observaciones generales de la devolución (ObservationsRequest
// confirmado en el swagger) -- return_date lo asigna el servidor y no hay
// forma de corregirlo después.
export async function actualizarDocumentoDevolucion(token, id, { observations }) {
  return laravelRequest(`/return_documents/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify({ observations }),
  })
}

// Detalles de Documento de Devolución (return_document_details): cada
// equipo incluido en una devolución. Lo normal es crearlos junto al
// documento (crearDocumentoDevolucion); estas sirven para completar una
// devolución ya firmada o corregir la observación de un equipo devuelto.
export async function listarDetallesDevolucion(token, { returnDocumentId } = {}) {
  const query = returnDocumentId != null ? `?returnDocumentId=${returnDocumentId}` : ''
  return laravelRequest(`/return_document_details${query}`, { token, method: 'GET' })
}

export async function agregarDetalleDevolucion(
  token,
  { return_document_id, delivery_document_detail_id, observations },
) {
  return laravelRequest('/return_document_details', {
    token,
    method: 'POST',
    body: JSON.stringify({ return_document_id, delivery_document_detail_id, observations }),
  })
}

export async function actualizarDetalleDevolucion(token, id, { observations }) {
  return laravelRequest(`/return_document_details/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify({ observations }),
  })
}

// URL pública de un archivo del disco "public" de Laravel (las firmas se
// guardan ahí como ruta relativa, ej. "signatures/uuid.png"). Por defecto,
// Storage::disk('public')->url($path) en Laravel arma esa URL como
// APP_URL + '/storage/' + la ruta -- que es la misma URL/puerto de
// AUTH_API_URL sin el '/api' final. Si el backend sirve los archivos desde
// otro dominio, se puede fijar VITE_STORAGE_URL en .env sin tocar este
// archivo.
const STORAGE_BASE_URL = (
  import.meta.env.VITE_STORAGE_URL || AUTH_API_URL.replace(/\/api\/?$/, '')
).replace(/\/$/, '')

// Si el backend ya manda un link completo (ej. un bucket de S3, como
// "https://...amazonaws.com/signatures/....png"), se usa tal cual -- pegarle
// STORAGE_BASE_URL por delante lo rompería. Solo se arma el link local
// (STORAGE_BASE_URL + /storage/) cuando lo que llega es la ruta corta que
// documenta el swagger (ej. "signatures/....png").
export function urlArchivoPublico(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${STORAGE_BASE_URL}/storage/${path}`
}

export default {
  checkApiHealth,
  login,
  checkStatus,
  registrarUsuario,
  crearActa,
  guardarFirma,
  reiniciarFirma,
  listarActas,
  obtenerActa,
  editarActa,
  eliminarActa,
  descargarPdfActa,
  obtenerAuditoria,
  exportarActasExcel,
  exportarAuditoriaExcel,
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
  listarMarcas,
  crearMarca,
  obtenerMarca,
  actualizarMarca,
  listarDepartamentos,
  crearDepartamento,
  obtenerDepartamento,
  actualizarDepartamento,
  listarEquipos,
  obtenerEquipo,
  crearEquipo,
  actualizarEquipo,
  listarEquiposDisponibles,
  historialEquipo,
  listarCaracteristicas,
  obtenerCaracteristica,
  crearCaracteristica,
  actualizarCaracteristica,
  obtenerCaracteristicasDeEquipo,
  listarEmpleados,
  obtenerEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  listarDocumentosEntrega,
  obtenerDocumentoEntrega,
  crearDocumentoEntrega,
  eliminarDocumentoEntrega,
  listarDetallesEntrega,
  agregarDetalleEntrega,
  actualizarDetalleEntrega,
  eliminarDetalleEntrega,
  listarDocumentosDevolucion,
  obtenerDocumentoDevolucion,
  crearDocumentoDevolucion,
  actualizarDocumentoDevolucion,
  listarDetallesDevolucion,
  agregarDetalleDevolucion,
  actualizarDetalleDevolucion,
  urlArchivoPublico,
}
