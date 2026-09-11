import { CSS_PAPEL_FISICO } from '../pdf/designSystemPdf.js'
import { generatePdfFromElements } from './generatePdf.js'

// Mismas medidas con las que pagina generatePdf.js (A4 vertical, en mm) y el
// mismo piso de contenido: si estos valores cambian allá, el conteo de hojas
// de aquí deja de coincidir con la realidad del PDF.
const ANCHO_PDF_MM = 210
const ALTO_PDF_MM = 297
const MIN_CONTENIDO_MM = 12

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

/** Alto en px de una hoja A4 al ancho con que está montada la `.page`. */
function altoDeHoja(hoja) {
  return (hoja.offsetWidth * ALTO_PDF_MM) / ANCHO_PDF_MM
}

/**
 * True si la hoja sale en UNA página física sin perder contenido. Se permite
 * que pase del alto A4 hasta MIN_CONTENIDO_MM (≈46px): generatePdf.js no abre
 * otra página por un sobrante así, y como el relleno inferior de la hoja es de
 * 56px (.page en designSystemPdf.js), lo que queda afuera es solo ese margen
 * vacío, nunca texto. Sin esta tolerancia, una devolución de pocos equipos que
 * siempre salió en una sola hoja pasaba a dos, con las firmas solas en la
 * segunda. Si el relleno inferior de .page baja de ~47px, hay que revisar esto.
 */
function cabeEnUnaHoja(hoja) {
  const toleranciaPx = (MIN_CONTENIDO_MM * hoja.offsetWidth) / ANCHO_PDF_MM
  return hoja.offsetHeight <= altoDeHoja(hoja) + toleranciaPx
}

/** Primer hijo directo de `hoja` que cumple la condición (sin bajar a los nietos). */
function hijoDirecto(hoja, condicion) {
  return Array.from(hoja.children).find(condicion) || null
}

/**
 * Parte una hoja que no entra en una página física: lo que sobra pasa a una
 * hoja nueva, justo después, con su propio membrete. Antes no se partía nada
 * aquí -- la captura de la hoja entera se cortaba "con tijera" al pasar a PDF,
 * y el pedazo de abajo salía sin membrete, sin los títulos de las columnas y a
 * veces con un renglón de la tabla partido por la mitad.
 *
 * Orden en que se libera espacio:
 *   1. Los bloques que van después de la tabla (cláusula, observaciones,
 *      firmas, pie), del último hacia arriba, hasta que la hoja entre.
 *   2. Si todavía no entra, los renglones de la tabla, que siguen en una tabla
 *      de continuación con el mismo encabezado de columnas, bajo el título de
 *      la sección marcado "(continuación)".
 *
 * Devuelve la hoja nueva (que puede quedar larga a su vez y partirse otra
 * vez) o null si no había nada que se pudiera mover.
 */
async function partirHoja(hoja) {
  const mast = hijoDirecto(hoja, (el) => el.classList.contains('mast'))
  const regla = hijoDirecto(hoja, (el) => el.classList.contains('rule2'))
  const tabla = hijoDirecto(hoja, (el) => el.tagName === 'TABLE')
  const tbody = tabla ? tabla.tBodies[0] : null

  const nueva = document.createElement('div')
  nueva.className = hoja.className
  const reglaClon = regla ? regla.cloneNode(true) : null
  if (mast) nueva.appendChild(mast.cloneNode(true))
  if (reglaClon) nueva.appendChild(reglaClon)
  hoja.after(nueva)
  // El logo del membrete clonado cambia el alto: hay que esperarlo antes de medir.
  await esperarImagenes(nueva)

  // Primer lugar libre de la hoja nueva, justo debajo de su membrete. Todo lo
  // que se mueve desde el final de `hoja` entra aquí, así que moviendo del
  // último al primero se conserva el orden original.
  const despuesDelMembrete = () => (reglaClon ? reglaClon.nextSibling : nueva.firstChild)

  // Nada de lo que está antes del corte (membrete, título, datos, la tabla
  // misma) se mueve como bloque.
  const corte = tabla || regla || mast
  // Nunca se mueve el primer bloque de contenido de la hoja: si ese solo ya no
  // entra, no hay forma de partirlo y se deja como está (así el proceso
  // siempre termina, en vez de pasar el mismo bloque de hoja en hoja).
  const esPrimerContenido = (el) => {
    const previo = el.previousElementSibling
    return !previo || previo === regla || previo === mast
  }
  const puedeMoverseElUltimo = () => {
    const ultimo = hoja.lastElementChild
    return Boolean(ultimo) && ultimo !== corte && ultimo !== regla && ultimo !== mast && !esPrimerContenido(ultimo)
  }

  // 1) Bloques del final, del último hacia arriba.
  while (!cabeEnUnaHoja(hoja) && puedeMoverseElUltimo()) {
    nueva.insertBefore(hoja.lastElementChild, despuesDelMembrete())
  }
  const moverElUltimo = () => nueva.insertBefore(hoja.lastElementChild, despuesDelMembrete())
  // Un título de sección no se queda solo al pie de la hoja: viaja con el
  // contenido que encabeza.
  const noDejarTituloSolo = () => {
    while (puedeMoverseElUltimo() && hoja.lastElementChild.classList.contains('sec')) moverElUltimo()
  }
  noDejarTituloSolo()
  // El pie ("Original: IT · Copia: RRHH" y la leyenda del sistema) tampoco
  // viaja solo: una hoja con nada más que el pie es la "hoja casi en blanco"
  // que ya se había corregido antes. Si es lo único que pasó, se lleva también
  // el bloque anterior (normalmente las firmas, con su título), y la hoja nueva
  // queda como una hoja de firmas con su pie.
  const esPie = (el) => el.classList.contains('foot') || el.classList.contains('verify')
  const soloPasoElPie = () => {
    const movidos = []
    for (let el = despuesDelMembrete(); el; el = el.nextElementSibling) movidos.push(el)
    return movidos.length > 0 && movidos.every(esPie)
  }
  if (soloPasoElPie() && puedeMoverseElUltimo()) {
    moverElUltimo()
    noDejarTituloSolo()
  }

  // 2) Renglones de la tabla (siempre queda al menos uno en esta hoja).
  if (!cabeEnUnaHoja(hoja) && tbody && tbody.rows.length > 1) {
    const ref = despuesDelMembrete()
    const secTabla = tabla.previousElementSibling
    if (secTabla && secTabla.classList.contains('sec')) {
      const secClon = secTabla.cloneNode(true)
      const titulo = secClon.querySelector('h2')
      // Si la hoja que se parte ya era una continuación, su título ya trae la
      // marca: no se repite ("(continuación) (continuación)").
      if (titulo && !titulo.textContent.endsWith('(continuación)')) {
        titulo.textContent = `${titulo.textContent} (continuación)`
      }
      nueva.insertBefore(secClon, ref)
    }
    const tablaNueva = tabla.cloneNode(false)
    if (tabla.tHead) tablaNueva.appendChild(tabla.tHead.cloneNode(true))
    const tbodyNuevo = document.createElement('tbody')
    tablaNueva.appendChild(tbodyNuevo)
    nueva.insertBefore(tablaNueva, ref)

    while (!cabeEnUnaHoja(hoja) && tbody.rows.length > 1) {
      tbodyNuevo.insertBefore(tbody.rows[tbody.rows.length - 1], tbodyNuevo.firstChild)
    }
  }

  // Si no se pudo mover nada, la hoja nueva sobra.
  if (!despuesDelMembrete()) {
    nueva.remove()
    return null
  }
  return nueva
}

/**
 * Reparte en hojas completas toda `.page` que no entre en una página física.
 * Así cada página del PDF es una hoja entera -- con membrete y, si es
 * continuación de la tabla, con los títulos de las columnas --, como si se
 * hubiera impreso a propósito, en vez de un pedazo cortado de una hoja larga.
 */
async function repartirHojasLargas(contenedor) {
  const porRevisar = Array.from(contenedor.children).filter((el) => el.classList.contains('page'))
  while (porRevisar.length) {
    const hoja = porRevisar.shift()
    if (cabeEnUnaHoja(hoja)) continue
    const continuacion = await partirHoja(hoja)
    // La continuación se revisa enseguida: con muchos equipos también puede
    // quedar larga y partirse de nuevo.
    if (continuacion) porRevisar.unshift(continuacion)
  }
}

/**
 * Cuántas hojas físicas del PDF va a ocupar este bloque `.page`, repitiendo la
 * misma cuenta que hace agregarElementoAlPdf() al cortar por altura. Después de
 * repartirHojasLargas() casi siempre es 1; solo da más si un bloque suelto era
 * más alto que una página entera y no se pudo partir (ahí queda el corte de
 * respaldo de generatePdf.js).
 */
function hojasQueOcupa(elemento) {
  const ancho = elemento.offsetWidth
  const alto = elemento.offsetHeight
  if (!ancho || !alto) return 1

  const altoMm = (alto * ANCHO_PDF_MM) / ancho
  let hojas = 1
  let resto = altoMm - ALTO_PDF_MM
  while (resto > MIN_CONTENIDO_MM) {
    hojas += 1
    resto -= ALTO_PDF_MM
  }
  return hojas
}

/**
 * Reescribe el "Pág. X-Y" de cada membrete con la paginación REAL del PDF.
 * Las plantillas escriben un número fijo (ej. 1-2 y 2-2 en Entrega) porque no
 * pueden saber cuánto va a medir el contenido; aquí, con todo ya repartido y
 * medido, cada membrete (incluidos los de las hojas de continuación) muestra
 * su número de hoja sobre el total real del documento.
 */
function corregirIndicePaginas(hojas) {
  const ocupadas = hojas.map(hojasQueOcupa)
  const total = ocupadas.reduce((suma, n) => suma + n, 0)

  let numero = 1
  hojas.forEach((hoja, indice) => {
    const etiqueta = hoja.querySelector('.pagina-indice')
    if (etiqueta) etiqueta.textContent = `${numero}-${total}`
    numero += ocupadas[indice]
  })
}

/**
 * Genera y descarga el PDF con el maquetado "papel físico" a partir de HTML
 * ya armado por una plantilla (construirHtmlEntrega / construirHtmlDevolucion).
 * No usa backend ni Puppeteer: monta el HTML fuera de pantalla, espera sus
 * imágenes (logo + firmas), reparte en hojas completas lo que no entre en una
 * página y reutiliza la misma captura que ya usaba el sistema
 * (generatePdfFromElements), una `.page` por página del PDF.
 */
export async function generarPdfPapelFisico(htmlPagina, filename) {
  inyectarEstiloUnaVez()

  const contenedor = document.createElement('div')
  contenedor.style.cssText = 'position:absolute;left:-10000px;top:0;'
  contenedor.innerHTML = htmlPagina
  document.body.appendChild(contenedor)

  try {
    // El orden importa: las imágenes (logo y firmas) cambian la altura de la
    // hoja, así que hay que esperarlas antes de medir para repartir y numerar.
    await esperarImagenes(contenedor)
    await repartirHojasLargas(contenedor)
    const hojas = Array.from(contenedor.querySelectorAll('.page'))
    corregirIndicePaginas(hojas)
    await generatePdfFromElements(hojas, filename)
  } finally {
    document.body.removeChild(contenedor)
  }
}
