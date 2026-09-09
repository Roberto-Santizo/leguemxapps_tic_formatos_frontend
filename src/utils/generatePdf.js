// Por debajo de esto, lo que sobra de un elemento (mm) ya no es contenido
// real -- es el padding inferior de la hoja (.page tiene 56px de padding
// abajo, ver designSystemPdf.js) o un redondeo de la captura. Sin este piso,
// un elemento que queda apenas unos milímetros más alto que una hoja física
// generaba una página extra casi en blanco solo para ese sobrante.
const MIN_CONTENIDO_MM = 12

// Agrega la captura de UN elemento al pdf ya abierto, en la posición actual
// (heightLeft/position en mm), paginando automáticamente si ese elemento por
// sí solo es más alto que una hoja física. `esPrimero` evita un salto de
// página en blanco antes del primer elemento.
async function agregarElementoAlPdf(pdf, element, html2canvas, esPrimero) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  if (!esPrimero) pdf.addPage()
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > MIN_CONTENIDO_MM) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }
}

/**
 * Captura un elemento del DOM y lo descarga como PDF (tamaño carta/A4),
 * paginando automáticamente si el contenido es más alto que una página.
 * jsPDF y html2canvas se cargan solo al llamar esta función (import
 * dinámico) para no pesar el bundle inicial de la app.
 */
export async function generatePdfFromElement(element, filename = 'documento.pdf') {
  if (!element) throw new Error('No se encontró el contenido a exportar')
  return generatePdfFromElements([element], filename)
}

/**
 * Igual que generatePdfFromElement, pero para varios elementos `.page`
 * (hojas físicas distintas, ej. una acta de 2 páginas con membrete repetido
 * en cada una) -- cada elemento arranca en una página nueva del PDF, en vez
 * de concatenarse en una sola imagen larga y cortarse a ciegas donde caiga.
 */
export async function generatePdfFromElements(elements, filename = 'documento.pdf') {
  if (!elements || elements.length === 0) throw new Error('No se encontró el contenido a exportar')

  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

  const pdf = new jsPDF('p', 'mm', 'a4')
  for (let indice = 0; indice < elements.length; indice += 1) {
    await agregarElementoAlPdf(pdf, elements[indice], html2canvas, indice === 0)
  }

  pdf.save(filename)
}
