import {
  Box,
  PackagePlus,
  ShieldCheck,
  ArrowLeftRight,
  Smartphone,
  Trash2,
} from 'lucide-react'

/**
 * Un objeto por formato físico del Departamento de TIC.
 *
 * Los seis formatos comparten la misma gramática (membrete, datos del
 * usuario, tabla de equipo, cláusula fija, observaciones, firmas), así que
 * NO existe una página por formato: existe <FormatoActa /> que lee esta
 * configuración desde la URL. Agregar un séptimo formato = agregar una
 * entrada aquí, sin escribir componentes nuevos.
 */

const ACC_DEVOL = ['Monitor', 'Mouse', 'UPS', 'Laptop', 'Cargador', 'Teclado', 'Impresora', 'Disco Externo', 'Otro', 'Celular']
const ACC_ENTREGA = ['PC', 'Monitor', 'Mouse', 'Teclado', 'UPS', 'Laptop', 'Cargador', 'Celular', 'Tablet', 'Otros']
const ACC_RESP = ['Monitor', 'Mouse', 'Teclado', 'UPS', 'Laptop', 'Cargador', 'Impresora', 'Disco Externo', 'Otro']
const ACC_PRESTAMO = ['PC', 'Monitor', 'Mouse', 'Teclado', 'UPS', 'Laptop', 'Cargador', 'Celular', 'Disco Externo', 'Otros']
const ACC_DESECHO = ['Monitor', 'Mouse', 'Teclado', 'UPS', 'Laptop', 'Cargador', 'Impresora', 'Disco Duro', 'Celular', 'Otro']

const CL_ENTREGA =
  'El usuario deberá responder por cualquier daño o pérdida parcial o total, será el único responsable en devolver los accesorios en buenas condiciones, el cual pertenece a la empresa AGROINDUSTRIA LEGUMEX S.A, esto para que pueda tener un mejor desarrollo de mis funciones, en el cual me comprometo a resguardarlo y darle un uso estrictamente laboral. Asimismo, hacemos de su conocimiento que no podrán sustituir ningún otro accesorio ni remplazarlos. En caso de daño o perjuicio a los equipos se estará notificando a RRHH y ellos tomaran las medidas necesarias.'

const CL_PRESTAMO = [
  'El usuario deberá responder por cualquier daño o pérdida parcial o total, será el único responsable en devolver los accesorios en buenas condiciones, el cual pertenece a la empresa AGROINDUSTRIA LEGUMEX S.A, esto para que pueda tener un mejor desarrollo de mis funciones, en el cual me comprometo a resguardarlo y darle un uso estrictamente laboral. Asimismo, hacemos de su conocimiento que no podrán sustituir ningún otro accesorio ni remplazarlos.',
  'En caso de daño o perjuicio a los equipos se estará notificando a RRHH y ellos tomaran las medidas necesarias.',
]

const CL_RESP = [
  'El usuario al cual se le hace entrega del equipo de cómputo será responsable del uso del mismo, el cual es exclusivo únicamente para desempeñar labores de trabajo, deberá responder por cualquier daño o pérdida parcial o total, será el único responsable en devolver el equipo de cómputo o accesorios en buenas condiciones o en el estado que se le hace entrega, el cual pertenece a la empresa AGROINDUSTRIA LEGUMEX S.A.',
  'Asimismo, hacemos de su conocimiento que no podrá modificar la configuración del equipo, no podrá instalar software sin ser autorizado, no podrá sustituir ni remplazar accesorios; todo cambio de software o hardware deberá ser evaluado por el departamento de Informática. El equipo no podrá ser extraído de la empresa; de ser necesario deberá solicitar un permiso a Informática avalado por Recursos Humanos.',
  'En caso de daño o robo a los equipos se estará notificando a RRHH y ellos tomarán las medidas necesarias teniendo como base el informe de Informática.',
]

const CL_TEL = [
  'El teléfono celular se otorga como préstamo, será utilizado por mi persona y seré el único responsable por el uso que le dé. Debe ser devuelto al momento en que termine la relación laboral con Agroindustria Legumex, S.A., o cuando la empresa así lo solicite, entregando el teléfono y el chip en buenas condiciones con todos sus accesorios; de no devolverlo deberá reponerse uno del mismo valor o se hará el descuento correspondiente con Recursos Humanos.',
  'En caso de pérdida, robo, extravío o daño, notificaré a la empresa inmediatamente para tramitar la reposición; en caso de robo deberá presentar carta de las autoridades locales. Por ningún motivo se bloqueará el número de teléfono, pues conlleva un costo que el usuario deberá cubrir. Si mi facturación no es fija, autorizo a la empresa a descontar el excedente de mi salario mensual.',
]

const CL_DESECHO = [
  'Por este medio se hace constar que el equipo detallado anteriormente se ha evaluado y se procederá a desecharlo.',
]

export const FORMATOS = {
  devolucion: {
    id: 'devolucion',
    icon: Box,
    codigo: 'DEV-EQ-01',
    titulo: 'Hoja de Devolución de Equipo',
    tituloCorto: 'Devolución de Equipo',
    descripcion: 'Devolución de equipo y accesorios al finalizar la relación laboral o al renovar el activo.',
    descripcionHistorial: 'Consulta las devoluciones de equipo ya registradas.',
    meta: '1 ó 2 páginas · Original IT, copia RRHH',
    labelFecha: 'Fecha de Devolución',
    labelResponsable: 'Responsable que Entrega',
    tieneDepartamento: true,
    tienePuesto: true,
    tieneRecibiDe: true,
    tieneModalidad: true,
    tieneTabla: true,
    accesorios: ACC_DEVOL,
    colFinal: 'Estado',
    colFinalTipo: 'select',
    tituloTablaCorta: 'Descripción de Equipo',
    tituloTablaLarga: 'Accesorios Devueltos',
    vacioTitulo: 'Todavía no hay accesorios en el acta',
    clausulas: [],
    tituloClausula: '',
    tieneConstanciaDevolucion: true,
    tituloFirmas: 'Constancia y Firmas',
    firmas: [
      { key: 'entrega', titulo: 'Nombre y Firma de quien Entrega', subtitulo: 'Usuario final' },
      { key: 'recibe', titulo: 'Nombre y Firma de quien Recibe', subtitulo: 'Soporte TI' },
    ],
    placeholderObs:
      'Anote cualquier daño estético, fallas reportadas no resueltas, o información relevante sobre el equipo devuelto...',
    textoAccion: 'Finalizar Devolución',
  },

  entrega: {
    id: 'entrega',
    icon: PackagePlus,
    codigo: 'E-EQUIPO',
    titulo: 'Entrega de Equipo',
    tituloCorto: 'Entrega de Equipo',
    descripcion: 'Entrega de PC, laptop, periféricos o celular a un colaborador, con tabla de artículos y firma de conformidad.',
    descripcionHistorial: 'Consulta, revisa y elimina las entregas de equipo ya registradas.',
    meta: '1 página · Original IT, copia RRHH',
    labelFecha: 'Fecha de Entrega',
    labelResponsable: 'Responsable que Recibe',
    tieneDepartamento: true,
    tienePuesto: false,
    tieneRecibiDe: true,
    tieneModalidad: false,
    tieneTabla: true,
    accesorios: ACC_ENTREGA,
    colFinal: 'Nuevo/Usado',
    colFinalTipo: 'select',
    tituloTablaCorta: 'Equipo / Accesorios',
    vacioTitulo: 'Todavía no hay artículos en el acta',
    clausulas: [CL_ENTREGA],
    tituloClausula: 'Cláusula de Responsabilidad',
    tituloFirmas: 'Constancia y Firmas',
    firmas: [
      { key: 'responsable', titulo: 'Firma Responsable', subtitulo: 'Colaborador que recibe' },
      { key: 'it', titulo: 'Encargado IT', subtitulo: 'Soporte TI' },
    ],
    placeholderObs: 'Anote cualquier detalle relevante sobre el equipo entregado...',
    textoAccion: 'Finalizar Entrega',
  },

  responsabilidad: {
    id: 'responsabilidad',
    icon: ShieldCheck,
    codigo: 'RE-R-EQUIPO',
    titulo: 'Hoja de Responsabilidad de Equipo',
    tituloCorto: 'Responsabilidad de Equipo',
    descripcion: 'Resguardo formal con ficha técnica completa del equipo y cláusula de uso.',
    meta: 'Formato de 2 páginas · IT, RRHH, Finanzas',
    labelFecha: 'Fecha',
    labelResponsable: 'Responsable',
    tieneDepartamento: true,
    tienePuesto: true,
    tieneRecibiDe: true,
    // El formato real ES de dos hojas: no se ofrece elegir. Todo el
    // formulario vive en una sola pantalla y la ficha técnica siempre se
    // muestra.
    tieneModalidad: false,
    fichaSiempre: true,
    tieneTabla: true,
    accesorios: ACC_RESP,
    colFinal: 'Nuevo/Usado',
    colFinalTipo: 'select',
    tituloTablaCorta: 'Accesorios',
    vacioTitulo: 'Todavía no hay accesorios en el acta',
    clausulas: CL_RESP,
    tituloClausula: 'Cláusula de Responsabilidad',
    tituloFirmas: 'Firmas',
    firmas: [
      { key: 'responsable', titulo: 'Firma Responsable', subtitulo: 'Colaborador que resguarda' },
      { key: 'tic', titulo: 'Encargado TIC', subtitulo: 'Departamento de TIC' },
    ],
    placeholderObs: 'Anote condiciones especiales del resguardo, faltantes o daños previos...',
    textoAccion: 'Finalizar Resguardo',
  },

  prestamo: {
    id: 'prestamo',
    icon: ArrowLeftRight,
    codigo: 'PR-E-EQUIPO',
    titulo: 'Préstamo de Equipo',
    tituloCorto: 'Préstamo de Equipo',
    descripcion: 'Equipo cedido temporalmente a un colaborador, con detalle de artículos y compromiso de devolución.',
    meta: '1 página · Original IT, copia RRHH',
    labelFecha: 'Fecha',
    labelResponsable: 'Responsable',
    tieneDepartamento: true,
    tienePuesto: false,
    tieneRecibiDe: true,
    tieneModalidad: false,
    tieneTabla: true,
    accesorios: ACC_PRESTAMO,
    colFinal: 'Nuevo/Usado',
    colFinalTipo: 'select',
    tituloTablaCorta: 'Equipo / Accesorios',
    vacioTitulo: 'Todavía no hay artículos en el acta',
    clausulas: CL_PRESTAMO,
    tituloClausula: 'Cláusula de Responsabilidad',
    tituloFirmas: 'Constancia y Firmas',
    firmas: [
      { key: 'responsable', titulo: 'Firma Responsable', subtitulo: 'Colaborador que recibe el préstamo' },
      { key: 'it', titulo: 'Encargado IT', subtitulo: 'Soporte TI' },
    ],
    placeholderObs: 'Anote plazo de devolución, estado del equipo u otro detalle relevante...',
    textoAccion: 'Finalizar Préstamo',
  },

  telefonos: {
    id: 'telefonos',
    icon: Smartphone,
    codigo: 'PRO-IT-01',
    titulo: 'Control de Entrega de Teléfonos',
    tituloCorto: 'Entrega de Teléfonos',
    descripcion: 'Comodato de celular: IMEI, número, plan tarifario y condiciones de uso. Incluye renovación.',
    descripcionHistorial: 'Próximamente: historial de comodatos de teléfono entregados.',
    meta: '1 página · Original IT, copia RRHH',
    labelFecha: 'Fecha',
    labelResponsable: 'Responsable',
    tieneDepartamento: false,
    tienePuesto: false,
    tieneRecibiDe: true,
    tieneModalidad: false,
    tieneTelefono: true,
    tieneTabla: false,
    accesorios: [],
    clausulas: CL_TEL,
    tituloClausula: 'Condiciones de Uso',
    // Las condiciones del formato físico se llenan sobre la línea: el
    // encabezado del bloque lleva campos en blanco tipo "____".
    tieneEncabezadoCondiciones: true,
    tieneConstanciaTelefono: true,
    tituloFirmas: 'Constancia y Firmas',
    firmas: [
      { key: 'colaborador', titulo: 'Firma', subtitulo: 'Colaborador que recibe' },
      { key: 'it', titulo: 'Encargado IT', subtitulo: 'Soporte TI' },
    ],
    placeholderObs: 'Anote detalles del plan, accesorios entregados o condiciones especiales...',
    textoAccion: 'Finalizar Entrega',
  },

  desecho: {
    id: 'desecho',
    icon: Trash2,
    codigo: 'DESECHO DE EQUIPO',
    titulo: 'Hoja de Desecho de Equipo',
    tituloCorto: 'Desecho de Equipo',
    descripcion: 'Baja de activos evaluados por TIC. No lleva colaborador: firma el encargado IT y RRHH.',
    meta: '1 página · Original IT, copia RRHH',
    labelFecha: 'Fecha',
    labelResponsable: 'Encargado',
    tieneDepartamento: false,
    tienePuesto: false,
    tieneRecibiDe: false,
    tieneModalidad: false,
    tieneTabla: true,
    accesorios: ACC_DESECHO,
    colFinal: 'Observaciones',
    colFinalTipo: 'texto',
    tituloTablaCorta: 'Descripción de Equipo a Desechar',
    vacioTitulo: 'Todavía no hay equipo en el acta',
    clausulas: CL_DESECHO,
    tituloClausula: 'Constancia de Evaluación',
    tituloFirmas: 'Firmas',
    firmas: [
      { key: 'it', titulo: 'Encargado IT', subtitulo: 'Quien evalúa el equipo' },
      { key: 'rrhh', titulo: 'Firma RRHH', subtitulo: 'Recursos Humanos' },
    ],
    placeholderObs: 'Detalle la evaluación técnica, el destino del equipo o el número de acta de baja...',
    textoAccion: 'Registrar Desecho',
  },
}

/**
 * Vigencia editorial de los 6 formatos, para control de documentos /
 * auditoría: cuándo se emitió esta versión y hasta cuándo es válida antes de
 * tener que renovarla. Es la MISMA para los 6 formatos hoy (así ya lo maneja
 * el sistema). Todavía no hay endpoint en el backend para esto (ver el TODO
 * en hooks/useLocalStorageState.js), así que por ahora se guarda con ese
 * mismo hook en localStorage -- editable con un clic directamente en el
 * membrete de "Nueva Acta" (InlineEditableText), sin tener que tocar código
 * cada vez que corresponda renovar la edición (ej. en unos años, pasar de
 * 2026-2027 a 2030-2031).
 *
 * `VIGENCIA_DOCUMENTOS` es el valor por defecto/inicial. `VIGENCIA_DOCUMENTOS_STORAGE_KEY`
 * es la llave de localStorage que usa FormatoActa.jsx con useLocalStorageState
 * (para que el campo sea editable en pantalla); `leerVigenciaDocumentos()` es
 * la misma lectura pero para código que no es un componente React (las
 * plantillas de PDF en src/pdf/), así ambos leen siempre el mismo valor.
 */
export const VIGENCIA_DOCUMENTOS = { emision: 'Enero 2026', vigencia: 'Enero 2027' }
export const VIGENCIA_DOCUMENTOS_STORAGE_KEY = 'legumex_vigencia_documentos'

export function leerVigenciaDocumentos() {
  try {
    const guardado = JSON.parse(localStorage.getItem(VIGENCIA_DOCUMENTOS_STORAGE_KEY) || 'null')
    if (guardado && guardado.emision && guardado.vigencia) return guardado
  } catch {
    // localStorage no disponible o valor corrupto -- se usa el valor por defecto
  }
  return VIGENCIA_DOCUMENTOS
}

// Orden en que aparecen las tarjetas del menú de "Nueva Acta" e "Historial
// de Actas". Solo se listan los 3 formatos activos hoy (Entrega, Devolución
// y Entrega de Teléfonos); Responsabilidad, Préstamo y Desecho se quedan
// definidos en FORMATOS (por si algún registro histórico del backend todavía
// los referencia) pero ya no aparecen en ninguna de las dos pantallas.
export const ORDEN_FORMATOS = ['entrega', 'devolucion', 'telefonos']

export const LISTA_FORMATOS = ORDEN_FORMATOS.map((id) => FORMATOS[id])

export function getFormato(id) {
  return FORMATOS[id] ?? null
}
