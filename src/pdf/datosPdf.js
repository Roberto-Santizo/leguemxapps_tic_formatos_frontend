// ============================================================================
// Datos que el PDF necesita ANTES de armar el HTML: las firmas como imagen
// incrustada y las características de cada equipo. Lo usan las vistas de
// entrega y devolución en "Descargar PDF".
// ============================================================================

import { listarEquipos, obtenerCaracteristicasDeEquipo, urlArchivoPublico } from '../services/api.js'
import { equipoPorSerie, idDirectoDelRenglon } from '../utils/equipoDeRenglon.js'

// Ruta dentro del disco public de Laravel ("signatures/x.png") a partir de lo
// que guarda el documento: la ruta corta del swagger o un link completo que
// pase por /storage/. null si es otro tipo de link (p. ej. S3).
function rutaEnStorage(path) {
  if (/^https?:\/\//i.test(path)) {
    try {
      const { pathname } = new URL(path)
      const i = pathname.indexOf('/storage/')
      return i >= 0 ? pathname.slice(i + '/storage/'.length) : null
    } catch {
      return null
    }
  }
  return String(path).replace(/^\/?(storage\/)?/, '')
}

function comoDataUrl(blob) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader()
    lector.onload = () => resolver(lector.result)
    lector.onerror = rechazar
    lector.readAsDataURL(blob)
  })
}

/**
 * Firma lista para el PDF (data URL) o null ("Sin firma").
 *
 * En pantalla la firma es un <img> con el link del backend y se ve siempre.
 * El PDF, en cambio, se arma "fotografiando" la hoja con html2canvas, y el
 * navegador solo deja capturar una imagen de OTRO servidor si ese servidor lo
 * permite (CORS) -- los archivos de /storage de Laravel no lo hacen. Por eso
 * la firma se descarga antes y se incrusta como data URL:
 *   1. `/storage/<ruta>` en el MISMO servidor del frontend, que la pasa al
 *      backend (proxy de Vite en desarrollo, de nginx en Docker): mismo
 *      origen, no necesita CORS.
 *   2. Si no hay proxy, el link directo del backend (funciona si algún día
 *      Laravel sirve /storage con CORS).
 * Si ninguno responde con una imagen, queda "Sin firma" en vez de fallar.
 */
export async function firmaParaPdf(path) {
  if (!path) return null
  const ruta = rutaEnStorage(path)
  const candidatos = [ruta ? `/storage/${ruta}` : null, urlArchivoPublico(path)].filter(Boolean)
  for (const url of candidatos) {
    try {
      const res = await fetch(url, { credentials: 'omit' })
      // Sin proxy, /storage/... cae en el index.html de la SPA: solo vale una imagen.
      if (!res.ok || !(res.headers.get('content-type') || '').startsWith('image/')) continue
      return await comoDataUrl(await res.blob())
    } catch {
      // siguiente candidato
    }
  }
  return null
}

// Pocas peticiones a la vez: 10 equipos son hasta 10 listas de características
// más el detalle de cada una.
const EN_PARALELO = 4

/**
 * Características de cada renglón del acta: { [item.id]: [{ name, description }] }.
 * El id del equipo sale del renglón o, si no viene, de buscar su serie en el
 * catálogo (se pide una sola vez). Un renglón que falla queda sin
 * características; nunca impide generar el PDF.
 */
export async function caracteristicasDeRenglones(token, items) {
  const lista = Array.isArray(items) ? items : []
  const resultado = {}
  if (lista.length === 0) return resultado

  let catalogo = null
  if (lista.some((it) => !idDirectoDelRenglon(it))) {
    try {
      const r = await listarEquipos(token)
      catalogo = Array.isArray(r) ? r : []
    } catch {
      catalogo = []
    }
  }

  const tareas = lista.map((item) => async () => {
    const id = idDirectoDelRenglon(item) ?? equipoPorSerie(catalogo, item)?.id
    if (!id) return
    try {
      const caract = await obtenerCaracteristicasDeEquipo(token, Number(id))
      resultado[item.id] = (Array.isArray(caract) ? caract : []).filter((c) => c && (c.name || c.description))
    } catch {
      // sin características para este renglón
    }
  })
  for (let i = 0; i < tareas.length; i += EN_PARALELO) {
    await Promise.all(tareas.slice(i, i + EN_PARALELO).map((t) => t()))
  }
  return resultado
}
