const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Backend nuevo (Laravel) -- de momento solo se usa para el login. El resto
// de endpoints (actas, auditoria, usuarios, etc.) siguen apuntando a API_URL
// hasta que se migren uno por uno.
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://32.192.191.85:8000/api'

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
async function laravelRequest(path, { token, ...options } = {}) {
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

// Gestión de usuarios (panel admin) -- Fase 2.
export async function listarUsuarios(token) {
  return authRequest('/api/usuarios', token, { method: 'GET' })
}

export async function crearUsuario(token, payload) {
  return authRequest('/api/usuarios', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function editarUsuario(token, id, payload) {
  return authRequest(`/api/usuarios/${id}`, token, {
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
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
}
