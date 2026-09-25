// ============================================================================
// Maquetado de PDF estilo "papel físico" -- adaptado del paquete
// legumex-pdf-generator (diseño validado contra las fotos del formato real)
// para correr 100% en el navegador, sin backend: se arma el HTML aquí mismo,
// se captura con html2canvas y se convierte a PDF con la misma utilidad que
// ya usaba el sistema (src/utils/generatePdf.js). El membrete (mast) es una
// traducción literal del original -- no se le cambió texto ni estructura.
//
// Todo va prefijado con la clase .lgx-pdf para no filtrar estilos al resto
// de la app mientras el nodo está montado (aunque sea fuera de pantalla).
// ============================================================================

// Cordillera del sistema (mismas tres capas que SierraFondo.jsx, un solo
// ciclo del perfil) como FONDO de cada hoja: ocupa el 40% inferior (470 de
// 1154px) y pasa por detrás de firmas, observaciones y pie -- la identidad
// "Sierra" también en el papel. Verde bosque con opacidades muy bajas para
// que el texto encima se lea igual y al imprimir gaste poca tinta.
// El SVG mide la hoja entera (816×1154, montañas en su parte baja) y se pinta
// a 100% × 100%: así su borde superior coincide con el de la hoja. Con una
// franja más baja, html2canvas dejaba un filete visible en el borde de la
// imagen, y sin width/height propios la dibujaba recortada.
const SIERRA_PAPEL = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="816" height="1154" viewBox="0 0 816 1154" preserveAspectRatio="none">' +
    '<g transform="translate(0 684) scale(0.6375 1.9583)">' +
    '<polygon fill="#0b2a1e" fill-opacity="0.03" points="0,240 0,60 170,10 340,50 520,0 700,45 870,4 1050,40 1190,12 1280,60 1280,240"/>' +
    '<polygon fill="#0b2a1e" fill-opacity="0.05" points="0,240 0,120 210,75 400,110 610,60 830,115 1020,80 1280,120 1280,240"/>' +
    '<polygon fill="#0b2a1e" fill-opacity="0.075" points="0,240 0,180 250,140 460,175 680,130 900,172 1100,145 1280,180 1280,240"/>' +
    '</g></svg>',
)

export const CSS_PAPEL_FISICO = `
.lgx-pdf, .lgx-pdf *{box-sizing:border-box;margin:0;padding:0}
.lgx-pdf{background:#FCFBF7}
.lgx-pdf.page{
  width:816px;min-height:1154px;color:#3B3934;
  padding:56px 91px 56px 96px;font-family:Carlito,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;
  /* Cordillera como FONDO de la hoja (no un hijo ni un ::after): el reparto
     en hojas de generatePdfPapelFisico.js no la mueve, siempre queda detrás
     del texto, y html2canvas la dibuja en su lugar (un ::after lo corría
     hacia arriba). */
  background:url("data:image/svg+xml,${SIERRA_PAPEL}") no-repeat left top / 100% 100%, #FCFBF7;
  background-origin:border-box;
}

/* MEMBRETE -- sin tocar: misma estructura y texto del maquetado original */
.lgx-pdf .mast{display:flex;align-items:center;justify-content:space-between;gap:18px}
.lgx-pdf .mast-id{display:flex;align-items:center;gap:17px}
.lgx-pdf .mast-id img{width:82px;height:auto;display:block}
.lgx-pdf .vr{width:1px;height:42px;background:#BEBAAD;flex:none}
.lgx-pdf .org{font-weight:700;font-size:14.5px;letter-spacing:.09em;text-transform:uppercase;color:#1A1A17;line-height:1.2;white-space:nowrap}
.lgx-pdf .dept{font-size:10.5px;letter-spacing:.015em;color:#5A574F;margin-top:5px;line-height:1.4}
.lgx-pdf .spec{display:flex;align-items:stretch;flex:none}
.lgx-pdf .spec > div{padding:0 8px;text-align:right;border-left:.8px solid #BEBAAD;white-space:nowrap}
.lgx-pdf .spec > div:first-child{border-left:none}
.lgx-pdf .spec > div:last-child{padding-right:0}
.lgx-pdf .spec .k{display:block;font-size:7px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#5A574F;white-space:nowrap}
.lgx-pdf .spec .v{display:block;font-size:11px;font-weight:700;color:#1A1A17;margin-top:5px;font-variant-numeric:tabular-nums;letter-spacing:.02em;white-space:nowrap}
.lgx-pdf .rule2{margin-top:14px;border-top:1.6px solid #1A1A17;border-bottom:.9px solid #2C4A2E;height:4px}

/* TITULO */
.lgx-pdf .titleblock{text-align:center;margin-top:22px}
.lgx-pdf .eyebrow{font-size:7.5px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:#5A574F}
.lgx-pdf .titleblock h1{font-family:Georgia,'Bitstream Charter',Charter,serif;font-weight:600;color:#1A1A17;font-size:26px;line-height:1.2;margin-top:7px}
/* Cresta bajo el título: el perfil de montaña del logo en una línea fina,
   entre dos filetes -- la firma visual del formato. */
.lgx-pdf .cresta{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:18px}
.lgx-pdf .cresta i{width:64px;height:.9px;background:#BEBAAD}
.lgx-pdf .cresta svg{display:block;width:34px;height:12px}

/* SECCIONES */
.lgx-pdf .sec{display:flex;align-items:baseline;gap:14px;margin:26px 0 0;height:13px}
.lgx-pdf .sec h2{font-weight:700;font-size:9.5px;letter-spacing:.20em;text-transform:uppercase;color:#1A1A17;white-space:nowrap}
.lgx-pdf .sec i{flex:1;height:1px;background:#BEBAAD}

/* CAMPOS */
.lgx-pdf .fields{display:grid;grid-template-columns:repeat(6,1fr);column-gap:26px;margin-top:16px}
.lgx-pdf .f{grid-column:span 3;min-height:60px;display:flex;flex-direction:column}
.lgx-pdf .f.c2{grid-column:span 2}.lgx-pdf .f.c4{grid-column:span 4}.lgx-pdf .f.c6{grid-column:span 6}
.lgx-pdf .lbl{font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#5A574F;line-height:13px}
.lgx-pdf .bx{min-height:34px;margin-top:6px;background:#F0EDE1;border-bottom:1px solid #A9A598;padding:7px 11px;display:flex;align-items:center}
.lgx-pdf .v{font-family:Georgia,'Bitstream Charter',Charter,serif;font-size:13.5px;color:#3B3934;line-height:1.3;word-break:break-word}
.lgx-pdf .v.ph{font-style:italic;color:#8F8B7E;font-size:12px}

/* TABLA -- alto de fila fijo NO se usa: crece con el contenido real */
.lgx-pdf table{width:100%;border-collapse:collapse;margin-top:16px}
.lgx-pdf thead th{background:#F0EDE1;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#1A1A17;text-align:left;padding:7px 10px;border-bottom:1.3px solid #1A1A17}
.lgx-pdf tbody td{font-family:Georgia,'Bitstream Charter',Charter,serif;font-size:12px;color:#3B3934;padding:7px 10px;border-bottom:.9px solid #D5D1C4;vertical-align:top;overflow-wrap:anywhere}
/* Características del equipo en una fila propia bajo la suya, a lo ancho de
   la tabla (desde la columna Equipo): letra de sistema pequeña y en gris,
   "Nombre: valor" separados por puntos medios. La fila del equipo pierde su
   filete inferior para que ambas se lean como un solo renglón.
   overflow-wrap en las celdas: una serie o una observación larga sin
   espacios parte la línea en vez de salirse de su columna. */
.lgx-pdf tbody tr.con-caract td{border-bottom:none;padding-bottom:3px}
.lgx-pdf tbody tr.caract-fila td{padding-top:0;padding-bottom:8px}
.lgx-pdf .caract{display:block;font-family:Carlito,'Segoe UI',sans-serif;font-size:9.5px;line-height:1.45;color:#5A574F}
.lgx-pdf .caract b{font-weight:700;color:#3B3934}
.lgx-pdf tbody td.num{font-variant-numeric:tabular-nums;color:#1A1A17}
.lgx-pdf tbody td.badge{font-family:Carlito,'Segoe UI',sans-serif;font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:#5A574F}
.lgx-pdf tbody tr:last-child td{border-bottom:1px solid #A9A598}
.lgx-pdf .tabla-vacia{padding:16px 10px;font-size:12px;color:#8F8B7E;font-style:italic}

/* EXTRAVÍO -- mismos colores de "error" que ya usa el resto del sistema
   (tailwind.config.js: error #B3453B / error-container #F1DCD9), para un
   equipo que en la devolución no regresó de verdad (pérdida/robo). */
.lgx-pdf tbody tr.extravio td{background:#F1DCD9}
.lgx-pdf tbody td.badge-extravio{font-family:Carlito,'Segoe UI',sans-serif;font-size:8.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:#B3453B;padding:2px 7px;border-radius:999px;margin-left:6px}

/* CLAUSULA */
.lgx-pdf .clause{font-family:Georgia,'Bitstream Charter',Charter,serif;font-size:12px;line-height:1.65;color:#3B3934;background:#F0EDE1;padding:14px 20px;margin-top:14px;border-left:2.5px solid #2C4A2E}
.lgx-pdf .clause p + p{margin-top:8px}
.lgx-pdf .clause b{font-weight:600;color:#1A1A17}

/* OBSERVACIONES */
.lgx-pdf .obsbox{min-height:44px;margin-top:12px;background:#F0EDE1;border-bottom:1px solid #A9A598;padding:10px 11px}
.lgx-pdf .obsbox .v{white-space:pre-wrap}

/* FIRMAS -- ahora sí soportan imagen real (antes solo era una casilla vacía) */
.lgx-pdf .signs{display:grid;gap:40px;margin-top:34px}
.lgx-pdf .sign .pad{height:70px;background:#F0EDE1;border-bottom:1px solid #1A1A17;display:flex;align-items:center;justify-content:center;overflow:hidden}
.lgx-pdf .sign .pad img{max-height:64px;max-width:100%;object-fit:contain}
.lgx-pdf .sign .pad .sinfirma{font-size:10px;color:#8F8B7E;font-style:italic}
.lgx-pdf .sign small{display:block;text-align:center;margin-top:8px;font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#5A574F}
.lgx-pdf .sign .sub{display:block;text-align:center;margin-top:2px;font-size:8.5px;color:#8F8B7E}

/* PIE -- ya no fija "Página X de Y" porque el documento fluye y se pagina
   automáticamente al exportar (mismo mecanismo que ya usaba el sistema). */
.lgx-pdf .foot{margin-top:34px;padding-top:10px;border-top:.9px solid #BEBAAD;display:flex;justify-content:space-between;align-items:baseline}
.lgx-pdf .foot .dist{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:#5A574F}
.lgx-pdf .verify{margin-top:8px;font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:#7F7C72;text-align:center}
`

export function esc(s) {
  if (s === undefined || s === null) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Membrete: logo real + razón social + ficha de código/emisión/vigencia.
 * Emisión y Vigencia son la fecha de control de documentos del FORMATO (para
 * auditoría: cuándo se emitió esta versión y hasta cuándo es válida) -- no es
 * la fecha real del trámite (esa va en "Datos del Usuario", en el cuerpo).
 * Vienen de VIGENCIA_DOCUMENTOS en config/formatos.js: un solo lugar para
 * actualizarlas cuando corresponda renovar la edición del formato.
 */
/**
 * `pagina`/`totalPaginas` (ambos 1-based) son opcionales: cuando se pasan,
 * agregan un cuarto dato al membrete tipo "1-2" -- página actual y total de
 * hojas del documento, tal como pidió el cliente.
 *
 * Lo que pasa aquí es solo el valor INICIAL, el que arma la plantilla según
 * cuántos bloques page() escribe. Si un bloque resulta más alto que una hoja
 * física (ej. una entrega con muchos equipos), generatePdfPapelFisico.js lo
 * reparte en hojas completas -- clonando este membrete en cada una -- y
 * después reescribe todos los `.pagina-indice` con la paginación real antes
 * de capturar. La clase es el punto de enganche de esa corrección: si se
 * cambia, hay que cambiarla también allá.
 */
export function mast({ codigo, emision, vigencia, pagina, totalPaginas }) {
  const indice = pagina && totalPaginas ? `${pagina}-${totalPaginas}` : null
  return `
  <header class="mast">
    <div class="mast-id">
      <img src="/logo-legumex-icon.png" alt="LEGUMEX">
      <div class="vr"></div>
      <div>
        <div class="org">Agroindustria Legumex, S.A.</div>
        <div class="dept">Departamento de Tecnologías de la Información</div>
      </div>
    </div>
    <div class="spec">
      <div><span class="k">Código</span><span class="v">${esc(codigo)}</span></div>
      <div><span class="k">Emisión</span><span class="v">${esc(emision || '—')}</span></div>
      <div><span class="k">Vigencia</span><span class="v">${esc(vigencia || '—')}</span></div>
      ${indice ? `<div><span class="k">Pág.</span><span class="v pagina-indice">${esc(indice)}</span></div>` : ''}
    </div>
  </header>
  <div class="rule2"></div>`
}

/**
 * Fila de características bajo la fila de un equipo ("Procesador: i7 · RAM:
 * 16 GB"), desde la columna Equipo hasta el final. Vacío si no tiene.
 * `columnas` = total de columnas de la tabla; `clase` se suma a la fila (p. ej.
 * "extravio", para que el fondo siga al renglón). generatePdfPapelFisico.js
 * nunca deja esta fila separada de la de su equipo al partir la tabla.
 */
export function filaCaracteristicas(lista, columnas, clase = '') {
  if (!Array.isArray(lista) || lista.length === 0) return ''
  const partes = lista.map((c) => (c.name && c.description ? `<b>${esc(c.name)}:</b> ${esc(c.description)}` : `<b>${esc(c.name || c.description)}</b>`))
  return `<tr class="caract-fila${clase ? ` ${clase}` : ''}"><td></td><td colspan="${columnas - 1}"><span class="caract">${partes.join(' &middot; ')}</span></td></tr>`
}

export function title(t) {
  return `<div class="titleblock"><div class="eyebrow">Formato Oficial</div><h1>${esc(t)}</h1>
  <div class="cresta"><i></i><svg viewBox="0 0 34 12" width="34" height="12"><polyline points="1,11 10,3.5 15,7.5 22,1 33,11" fill="none" stroke="#2C4A2E" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/></svg><i></i></div></div>`
}

export function sec(name) {
  return `<div class="sec"><h2>${esc(name)}</h2><i></i></div>`
}

export function fld(label, { span = 3, val = '', ph = '' } = {}) {
  const inner = val ? `<span class="v">${esc(val)}</span>` : `<span class="v ph">${esc(ph || '—')}</span>`
  return `<div class="f c${span}"><span class="lbl">${esc(label)}</span><div class="bx">${inner}</div></div>`
}

export function clause(...parrafos) {
  if (!parrafos.length) return ''
  return `<div class="clause">${parrafos.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`
}

export function observaciones(texto) {
  const inner = texto ? `<span class="v">${esc(texto)}</span>` : `<span class="v ph">Sin observaciones.</span>`
  return `<div class="obsbox">${inner}</div>`
}

/**
 * Fila de firmas -- ahora acepta `url` (firma real ya capturada por el
 * sistema, vía urlArchivoPublico) y la inserta como imagen dentro del
 * recuadro. Sin url, muestra "Sin firma", igual que en pantalla.
 */
export function signs(firmantes) {
  const cols = `repeat(${firmantes.length},1fr)`
  const bloques = firmantes
    .map(
      (f) => `<div class="sign">
        <div class="pad">${f.url ? `<img src="${esc(f.url)}" alt="Firma de ${esc(f.titulo)}" crossorigin="anonymous">` : '<span class="sinfirma">Sin firma</span>'}</div>
        <small>${esc(f.titulo)}</small>
        ${f.subtitulo ? `<span class="sub">${esc(f.subtitulo)}</span>` : ''}
      </div>`,
    )
    .join('')
  return `<div class="signs" style="grid-template-columns:${cols}">${bloques}</div>`
}

export function foot(distribucion = 'Original: IT &middot; Copia: RRHH') {
  return `<div class="foot"><div class="dist">${distribucion}</div></div>
  <div class="verify">Documento generado por el Sistema de Control Operativo TIC &middot; Agroindustria Legumex, S.A.</div>`
}

/** Envuelve el body de una hoja en el contenedor .page (sin doctype/html: se inyecta en un div ya montado en el DOM). */
export function page(bodyHtml) {
  return `<div class="lgx-pdf page">${bodyHtml}</div>`
}
