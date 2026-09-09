import { CSS_PAPEL_FISICO } from '../pdf/designSystemPdf.js'
import { generatePdfFromElements } from './generatePdf.js'

let estiloInyectado = false

function inyectarEstiloUnaVez() {
  if (estiloInyectado) return
  const style = document.createElement('style')
  style.setAttribute('data-lgx-pdf', 'true')
  style.textContent = CSS_PAPEL_FISICO
  document.head.appendChild(style)
  estiloInyectado = true
}

/** Espera a que todas las <img> del contenedor terminen de cargar (o fallen) antes de capturar. */
function esperarImagenes(contenedor) {
  const imgs = Array.from(contenedor.querySelectorAll('img'))
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) return resolve()
          img.addEventListener('load', resolve, { once: true })
          img.addEventListener('error', () => {
            // Firma sin storage conectado todavía, o ruta caída: se quita la
            // imagen rota y se deja el mismo "Sin firma" que ya usa la pantalla.
            const pad = img.closest('.pad')
            if (pad) pad.innerHTML = '<span class="sinfirma">Sin firma</span>'
            resolve()
          }, { once: true })
        }),
    ),
  )
}

/**
 * Genera y descarga el PDF con el maquetado "papel físico" a partir de HTML
 * ya armado por una plantilla (construirHtmlEntrega / construirHtmlDevolucion).
 * No usa backend ni Puppeteer: monta el HTML fuera de pantalla, espera sus
 * imágenes (logo + firmas) y reutiliza exactamente la misma captura +
 * paginación que ya usaba el sistema (generatePdfFromElements).
 *
 * `htmlPagina` puede traer una sola `.page` (formato de 1 hoja) o varias
 * concatenadas (formato de 2 hojas, ej. Entrega con membrete repetido) --
 * cada `.page` se captura por separado y arranca en una página nueva del
 * PDF, así el corte siempre cae entre hojas y nunca a la mitad de una tabla.
 */
export async function generarPdfPapelFisico(htmlPagina, filename) {
  inyectarEstiloUnaVez()

  const contenedor = document.createElement('div')
  contenedor.style.cssText = 'position:absolute;left:-10000px;top:0;'
  contenedor.innerHTML = htmlPagina
  document.body.appendChild(contenedor)

  try {
    await esperarImagenes(contenedor)
    const hojas = Array.from(contenedor.querySelectorAll('.page'))
    await generatePdfFromElements(hojas, filename)
  } finally {
    document.body.removeChild(contenedor)
  }
}
