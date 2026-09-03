// ---------------------------------------------------------------------------
// PEGAR AL FINAL DE src/services/api.js  (no es un archivo para copiar tal cual)
//
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

import { laravelRequest } from './api.js'

export async function listarEquipos(token) {
  return laravelRequest('/equipments', { token, method: 'GET' })
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

// Y en el `export default { ... }` de api.js, agregar:
//   listarEquipos, obtenerEquipo, crearEquipo, actualizarEquipo,
//   listarCaracteristicas, obtenerCaracteristica, crearCaracteristica,
//   actualizarCaracteristica, obtenerCaracteristicasDeEquipo,
