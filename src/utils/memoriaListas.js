// Memoria de la última vista de cada lista (búsqueda, filtros y página),
// para que entrar a "ver" o "editar" y volver con el botón de la pantalla, el
// menú o tras guardar no obligue a escribir la búsqueda de nuevo. Se guarda la
// query string tal cual (`page=2&limit=20&q=laptop+dell&marca=3`) por ruta.
//
// sessionStorage: sobrevive a un refresco pero no a cerrar la pestaña, y se
// borra al cerrar sesión (AuthContext.logout) para que otra cuenta en el mismo
// navegador no herede la búsqueda. Si el almacenamiento no está disponible
// (modo privado, bloqueado) se sigue en memoria y, si tampoco, sin recordar.
const CLAVE = 'legumex_listas'

let memoria = null

function cargar() {
  if (memoria) return memoria
  try {
    const guardado = JSON.parse(sessionStorage.getItem(CLAVE) || '{}')
    memoria = guardado && typeof guardado === 'object' && !Array.isArray(guardado) ? guardado : {}
  } catch {
    memoria = {}
  }
  return memoria
}

export function leerVistaLista(ruta) {
  const valor = cargar()[ruta]
  return typeof valor === 'string' ? valor : ''
}

export function guardarVistaLista(ruta, query) {
  const vistas = cargar()
  if (vistas[ruta] === query) return
  vistas[ruta] = query
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(vistas))
  } catch {
    // sin almacenamiento: queda solo en memoria
  }
}

export function olvidarVistasListas() {
  memoria = {}
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    // sin almacenamiento, nada que borrar
  }
}
