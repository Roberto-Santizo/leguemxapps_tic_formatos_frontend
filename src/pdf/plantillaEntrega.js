// ============================================================================
// Plantilla de PDF "papel físico" -- Hoja de Entrega de Equipo (E-EQUIPO).
// Recibe el documento real de GET /delivery_documents/{id} (mismo shape que
// ya consume HistorialEntregaView.jsx) más `formato` (FORMATOS.entrega) para
// no repetir textos que ya viven en config/formatos.js.
// ============================================================================

import { mast, title, sec, fld, clause, observaciones, signs, foot, page, esc } from './designSystemPdf.js'
import { leerVigenciaDocumentos } from '../config/formatos.js'
import { formatearFecha } from '../utils/fecha.js'

function nombrePlanta(location) {
  if (location === 'Planta Tejar' || location === 'Planta Parramos') return location
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

function filaEquipo(item, indice) {
  return `
  <tr>
    <td class="num">${String(indice + 1).padStart(2, '0')}</td>
    <td>${esc(item.equipment_name)}${item.returned ? ' <span class="badge">(Devuelto)</span>' : ''}</td>
    <td>${esc(item.equipment_brand) || '&mdash;'}</td>
    <td>${esc(item.equipment_model) || '&mdash;'}</td>
    <td>${esc(item.equipment_serie) || '&mdash;'}</td>
    <td>${esc(item.is_used) || '&mdash;'}</td>
    <td>${esc(item.observations) || '&mdash;'}</td>
  </tr>`
}

/**
 * @param {object} documento  Respuesta de GET /delivery_documents/{id}
 * @param {object} formato    FORMATOS.entrega (config/formatos.js)
 * @param {{responsable: string|null, it: string|null}} firmaUrls  URLs ya resueltas (urlArchivoPublico)
 */
export function construirHtmlEntrega(documento, formato, firmaUrls) {
  const items = documento.items || []
  const filas = items.length
    ? items.map(filaEquipo).join('')
    : `<tr><td colspan="7" class="tabla-vacia">Sin equipo registrado.</td></tr>`

  // Formato de 2 hojas (igual que el papel físico): membrete repetido en
  // ambas. Página 1 = datos del usuario + tabla de equipo. Página 2 =
  // membrete, cláusula de responsabilidad (penúltima sección), observaciones
  // y firmas al final -- mismo orden que ya tenía el documento de 1 página,
  // solo que ahora el corte cae entre hojas y no a la mitad de una tabla.
  const pagina1 = `
  ${mast({ codigo: formato.codigo, ...leerVigenciaDocumentos(), pagina: 1, totalPaginas: 2 })}
  ${title(formato.titulo)}
  ${sec('Datos del Usuario')}
  <div class="fields">
    ${fld('Fecha de Entrega', { span: 3, val: formatearFecha(documento.delivery_date) })}
    ${fld('Planta', { span: 3, val: nombrePlanta(documento.location) })}
    ${fld('Responsable que Recibe', { span: 6, val: documento.employee_name })}
    ${fld('Departamento', { span: 3, val: documento.employee_department })}
    ${fld('Recibí de', { span: 3, val: 'Agroindustria Legumex, S.A.' })}
    ${fld('Registrado por', { span: 3, val: documento.user_name })}
  </div>
  ${sec(formato.tituloTablaCorta)}
  <table>
    <thead><tr>
      <th style="width:6%">No.</th><th style="width:24%">Equipo</th><th style="width:14%">Marca</th>
      <th style="width:16%">Modelo</th><th style="width:16%">No. Serie</th><th style="width:10%">Estado</th><th style="width:14%">Observaciones</th>
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>`

  const pagina2 = `
  ${mast({ codigo: formato.codigo, ...leerVigenciaDocumentos(), pagina: 2, totalPaginas: 2 })}
  ${clause(...formato.clausulas)}
  ${sec('Observaciones Generales')}
  ${observaciones(documento.observations)}
  ${sec(formato.tituloFirmas)}
  ${signs(
    formato.firmas.map((f, i) => ({
      titulo: f.titulo,
      subtitulo: f.subtitulo,
      url: i === 0 ? firmaUrls.responsable : firmaUrls.it,
    })),
  )}
  ${foot()}`

  return page(pagina1) + page(pagina2)
}
