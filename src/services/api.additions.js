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

/*
  Y dentro del objeto `export default { ... }` que ya existe al final del
  archivo, agrega estas ocho entradas:

  listarMarcas,
  crearMarca,
  obtenerMarca,
  actualizarMarca,
  listarDepartamentos,
  crearDepartamento,
  obtenerDepartamento,
  actualizarDepartamento,
*/
