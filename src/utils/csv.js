/**
 * Exportación a CSV que Excel en español abre bien a la primera:
 *  - separador `;` (Excel con configuración regional en español usa la coma
 *    como separador decimal y espera `;` entre columnas);
 *  - BOM UTF-8 al inicio, para que los acentos y la ñ no salgan rotos;
 *  - saltos de línea CRLF;
 *  - comillas dobles cuando el valor trae `;`, comillas o saltos de línea.
 *
 * Seguridad: un valor que empieza con = + - @ (o tabulador / retorno) Excel
 * lo interpreta como fórmula ("inyección CSV"). Como los datos vienen de lo
 * que cualquiera escribió en el sistema (nombres, observaciones), a esos
 * valores se les antepone un apóstrofo para que se muestren como texto.
 *
 * columnas: [{ titulo, valor: (fila) => string | number | null }]
 */
const SEPARADOR = ';'

function celda(valor) {
  let texto = valor === null || valor === undefined ? '' : String(valor)
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
  if (/[";\r\n]/.test(texto)) texto = `"${texto.replace(/"/g, '""')}"`
  return texto
}

export function generarCsv(columnas, filas) {
  const encabezado = columnas.map((c) => celda(c.titulo)).join(SEPARADOR)
  const cuerpo = filas.map((fila) => columnas.map((c) => celda(c.valor(fila))).join(SEPARADOR))
  return [encabezado, ...cuerpo].join('\r\n')
}

/** Nombre de archivo seguro: sin acentos ni caracteres raros, con la fecha del día. */
export function nombreArchivoCsv(base) {
  const d = new Date()
  const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const limpio = String(base)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `${limpio || 'exportacion'}-${fecha}.csv`
}

export function descargarCsv(nombreArchivo, columnas, filas) {
  const contenido = '﻿' + generarCsv(columnas, filas)
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  // Se libera después: algunos navegadores todavía leen el blob tras el click.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
