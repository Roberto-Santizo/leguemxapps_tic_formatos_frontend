// ============================================================================
// Plantilla de PDF "papel físico" -- Hoja de Devolución de Equipo (DEV-EQ-01).
// Recibe el documento real de GET /return_documents/{id} (mismo shape que ya
// consume HistorialDevolucionView.jsx): a diferencia del maquetado original
// (pensado para una sola pieza de equipo con Original/Clon, Nuevo/Usado a
// mano) esta versión recibe el arreglo real `items[]`, que puede traer 1 o
// varios equipos según la devolución sea parcial o completa.
// ============================================================================

import { mast, title, sec, fld, observaciones, signs, foot, page, esc } from './designSystemPdf.js'
import { leerVigenciaDocumentos } from '../config/formatos.js'

function nombrePlanta(location) {
  if (location === 'Planta Tejar' || location === 'Planta Parramos') return location
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

function filaEquipo(item, indice) {
  return `
  <tr>
    <td class="num">${String(indice + 1).padStart(2, '0')}</td>
    <td>${esc(item.equipment_name)}</td>
    <td>${esc(item.equipment_brand) || '&mdash;'}</td>
    <td>${esc(item.equipment_model) || '&mdash;'}</td>
    <td>${esc(item.equipment_serie) || '&mdash;'}</td>
    <td>${esc(item.observations) || '&mdash;'}</td>
  </tr>`
}

/**
 * @param {object} documento  Respuesta de GET /return_documents/{id}
 * @param {object} formato    FORMATOS.devolucion (config/formatos.js)
 * @param {{entrega: string|null, recibe: string|null}} firmaUrls  URLs ya resueltas (urlArchivoPublico)
 */
export function construirHtmlDevolucion(documento, formato, firmaUrls) {
  const items = documento.items || []
  const filas = items.length
    ? items.map(filaEquipo).join('')
    : `<tr><td colspan="6" class="tabla-vacia">Sin equipo registrado.</td></tr>`

  const body = `
  ${mast({ codigo: formato.codigo, ...leerVigenciaDocumentos() })}
  ${title(formato.titulo)}
  ${sec('Datos del Usuario')}
  <div class="fields">
    ${fld('Fecha de Devolución', { span: 3, val: documento.return_date })}
    ${fld('Planta', { span: 3, val: nombrePlanta(documento.location) })}
    ${fld('Colaborador', { span: 6, val: documento.employee_name })}
    ${fld('Departamento', { span: 3, val: documento.employee_department })}
    ${fld('Entrega de Origen', { span: 3, val: documento.delivery_document_id ? `Entrega #${documento.delivery_document_id}` : '' })}
    ${fld('Registrado por', { span: 3, val: documento.user_name })}
  </div>
  ${sec(formato.tituloTablaCorta)}
  <table>
    <thead><tr>
      <th style="width:6%">No.</th><th style="width:26%">Equipo</th><th style="width:16%">Marca</th>
      <th style="width:18%">Modelo</th><th style="width:18%">No. Serie</th><th style="width:16%">Observaciones</th>
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>
  ${sec('Observaciones Generales')}
  ${observaciones(documento.observations)}
  ${sec(formato.tituloFirmas)}
  ${signs(
    formato.firmas.map((f, i) => ({
      titulo: f.titulo,
      subtitulo: f.subtitulo,
      url: i === 0 ? firmaUrls.entrega : firmaUrls.recibe,
    })),
  )}
  ${foot()}`

  return page(body)
}
