import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { conOrigen } from '../utils/origenNavegacion.js'
import { ArrowLeft, ChevronRight, HardDrive, History, PackagePlus, Pencil, Undo2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import { SkeletonDetalle } from '../components/Skeleton.jsx'
import {
  obtenerEmpleado,
  listarDepartamentos,
  equiposDeEmpleado,
  listarDocumentosEntrega,
  listarDocumentosDevolucion,
} from '../services/api.js'
import { formatearFecha } from '../utils/fecha.js'
import { nombreEstado, puntoEstado } from '../utils/estadoEntrega.js'
import { esExtravio } from '../utils/extravio.js'

// Recetas visuales "Sierra" (BRIEF, ola 2), repetidas a propósito.
const botonVolver =
  'btn-secundario h-9 gap-2 self-start px-3'
const botonSecundario =
  'btn-secundario h-10 shrink-0 gap-2 whitespace-nowrap px-4 shadow-sm'
const etiquetaDato = 'mb-1 font-mono text-micro uppercase leading-4 tracking-[0.1em] text-on-surface-variant'
const panelDato = 'min-w-0 rounded-xl bg-surface-container-high px-4 py-3'
const tituloSeccion =
  'mb-4 flex items-center gap-2 font-headline-md text-headline-md font-bold text-on-surface'

// ¿El acta es de este colaborador? Por id; si el acta no trae employee_id,
// por nombre (mismo criterio que el historial por departamento).
function esDelColaborador(doc, empleado) {
  if (doc?.employee_id != null) return String(doc.employee_id) === String(empleado.id)
  return Boolean(empleado.name) && String(doc?.employee_name ?? '').trim().toLowerCase() === empleado.name.trim().toLowerCase()
}

// "Laptop ThinkPad E14, Mouse y 2 más". null si la lista no trae los equipos
// (entonces no se afirma "sin equipos": el detalle del acta sí los tiene).
function resumenEquipos(items) {
  if (!Array.isArray(items)) return null
  const nombres = items.map((it) => it.equipment_name).filter(Boolean)
  if (nombres.length === 0) return null
  if (nombres.length <= 2) return nombres.join(', ')
  return `${nombres.slice(0, 2).join(', ')} y ${nombres.length - 2} más`
}

function nombrePlanta(location) {
  if (location === 'Planta Tejar' || location === 'Planta Parramos') return location
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

/**
 * Vista de solo lectura de un empleado -- destino de tocar la tarjeta en móvil
 * (o el ojo en escritorio), igual que EquipoView. "Editar" pide confirmación y,
 * al aceptar, navega a /catalogo/empleados/:id.
 *
 * Carga el registro por su id contra la API. Antes usaba los datos que le
 * pasaba la lista al navegar (`location.state`), así que al recargar la página
 * o al abrir la dirección directa mostraba "No hay información para mostrar" --
 * además de incumplir la regla del proyecto de cargar siempre por id.
 *
 * Muestra también el equipo que la persona tiene en este momento
 * (GET /employees/{id}/equipments): son los equipos de sus entregas que
 * todavía no se devolvieron, y cada uno enlaza con el acta de la que salió.
 *
 * Y su historial completo de actas (entregas y devoluciones, de la más nueva a
 * la más vieja), para responder "¿qué equipo tuvo?" o "¿ya devolvió el
 * mouse?" sin buscar acta por acta. Se piden las listas completas y se filtra
 * por `employee_id` en el cliente: el filtro `employeeId` del backend falló al
 * probarlo (ver api.js, listarDocumentosEntrega). Carga aparte: si falla, el
 * resto de la ficha sigue sirviendo.
 */
function EmpleadoView() {
  const { id } = useParams()
  const location = useLocation()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [empleado, setEmpleado] = useState(null)
  const [departamentos, setDepartamentos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [errorEquipos, setErrorEquipos] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Sube con "Reintentar" para volver a pedir el empleado tras un error.
  const [intento, setIntento] = useState(0)
  const [confirmando, setConfirmando] = useState(false)
  // null = cargando; [] = sin actas. Cada elemento: { tipo, doc, fecha }.
  const [historial, setHistorial] = useState(null)
  const [errorHistorial, setErrorHistorial] = useState(false)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    setError('')
    setErrorEquipos(false)
    Promise.all([
      obtenerEmpleado(token, Number(id)),
      // El nombre del departamento no viene en el empleado (solo su id), así
      // que se resuelve contra el catálogo, igual que en la lista.
      listarDepartamentos(token).catch(() => []),
      // Si falla solo esto, la pantalla igual sirve: se avisa dentro de su
      // sección en vez de tumbar todo el detalle.
      equiposDeEmpleado(token, Number(id)).catch(() => {
        if (vivo) setErrorEquipos(true)
        return []
      }),
    ])
      .then(([emp, deptos, asignados]) => {
        if (!vivo) return
        // Este endpoint NO responde 404 cuando el id no existe: contesta "todo
        // bien" con el dato vacío. Sin esta comprobación, la pantalla quedaría
        // en blanco al entrar a un empleado borrado o con un id mal escrito.
        if (!emp) {
          setError('No existe un empleado con ese identificador.')
          return
        }
        setEmpleado(emp)
        setDepartamentos(Array.isArray(deptos) ? deptos : [])
        setEquipos(Array.isArray(asignados) ? asignados : [])
      })
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el empleado'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [id, token, intento])

  useEffect(() => {
    if (!empleado) return undefined
    let vivo = true
    setHistorial(null)
    setErrorHistorial(false)
    Promise.all([listarDocumentosEntrega(token), listarDocumentosDevolucion(token)])
      .then(([entregas, devoluciones]) => {
        if (!vivo) return
        const lista = [
          ...(Array.isArray(entregas) ? entregas : [])
            .filter((d) => esDelColaborador(d, empleado))
            .map((doc) => ({ tipo: 'entrega', doc, fecha: doc.delivery_date })),
          ...(Array.isArray(devoluciones) ? devoluciones : [])
            .filter((d) => esDelColaborador(d, empleado))
            .map((doc) => ({ tipo: 'devolucion', doc, fecha: doc.return_date })),
        ]
        // Más nueva primero; a igual fecha, la devolución después de su entrega.
        lista.sort((a, b) => String(b.fecha ?? '').localeCompare(String(a.fecha ?? '')) || (a.tipo === 'devolucion' ? -1 : 1))
        setHistorial(lista)
      })
      .catch(() => {
        if (!vivo) return
        setErrorHistorial(true)
        setHistorial([])
      })
    return () => {
      vivo = false
    }
  }, [empleado, token])

  const departamento = empleado
    ? empleado.department || departamentos.find((d) => d.id === empleado.department_id)?.name || '—'
    : '—'

  return (
    <div className="animate-view-in flex-1 px-4 pt-6 pb-10 tablet:px-8 tablet:pt-8 md:px-8 md:pt-10">
      {/* Mismo carril de 1200px que la lista del catálogo (ver y editar no
          cambian de ancho respecto a ella). */}
      <div className="mx-auto flex max-w-[1200px] flex-col gap-stack-lg">
        <Link to="/catalogo/empleados" className={botonVolver}>
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Empleados
        </Link>

        {cargando ? (
          <SkeletonDetalle secciones={2} camposPorSeccion={2} />
        ) : error ? (
          <div className="rounded-tarjeta bg-white shadow-tarjeta">
            <EstadoVacio
              variante="error"
              titulo="No se pudo cargar el empleado"
              descripcion={error}
              accion={
                <button
                  type="button"
                  onClick={() => setIntento((n) => n + 1)}
                  className={botonSecundario}
                >
                  Reintentar
                </button>
              }
            />
          </div>
        ) : (
          <>
            {/* Rejilla de 2 columnas: el eyebrow ocupa todo el ancho y "Editar"
                queda siempre a la derecha del título (en móvil no baja a una
                línea propia). El envoltorio del texto es `contents` para no
                cambiar el orden del DOM. En móvil "Editar" se centra con la primera
                línea del título y la bajada usa todo el ancho; desde md: baja al pie
                de la bajada. */}
            <div className="-mt-1 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 md:mt-0">
              <div className="contents">
                <div className="col-span-2 flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
                  <span aria-hidden="true" className="h-px w-7 bg-outline" />
                  Catálogo / Empleados / Detalle
                </div>
                <h1 className="col-start-1 row-start-2 mt-1.5 break-words font-display-lg text-titulo-movil text-on-surface md:text-display-lg">
                  {empleado.name}
                </h1>
                <p className="col-span-2 row-start-3 mt-1 md:col-span-1 font-body-lg text-body-lg text-on-surface-variant">Información completa del empleado.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className={`col-start-2 row-start-2 mt-px self-start md:row-span-2 md:mt-0 md:self-end ${botonSecundario}`}
              >
                <Pencil className="h-4 w-4" strokeWidth={1.75} />
                Editar
              </button>
            </div>

            <section data-reveal className="rounded-tarjeta bg-white p-4 shadow-tarjeta md:p-6">
              <h2 className={tituloSeccion}>Datos del empleado</h2>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div className={panelDato}>
                  <p className={etiquetaDato}>Código</p>
                  <p className="break-words font-mono text-body-md text-on-surface">{empleado.code || '—'}</p>
                </div>
                <div className={panelDato}>
                  <p className={etiquetaDato}>Departamento</p>
                  <p className="break-words font-body-md text-body-md font-medium text-on-surface">{departamento}</p>
                </div>
              </div>
            </section>

            <section data-reveal className="rounded-tarjeta bg-white p-4 shadow-tarjeta md:p-6">
              <h2 className={tituloSeccion}>
                <HardDrive className="h-5 w-5 shrink-0 text-on-surface-variant" strokeWidth={1.75} />
                {equipos.length > 0 ? `Equipo en su poder (${equipos.length})` : 'Equipo en su poder'}
              </h2>

              {errorEquipos ? (
                <p className="font-label-sm text-label-sm text-error">
                  No se pudo cargar el equipo asignado. Vuelve a entrar para intentarlo de nuevo.
                </p>
              ) : equipos.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  No tiene equipo asignado en este momento.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-outline-variant">
                  {equipos.map((eq) => (
                    <li
                      key={eq.delivery_document_detail_id}
                      className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-body-md text-body-md font-semibold text-on-surface break-words">
                          {eq.equipment_name || '—'}
                        </p>
                        <p className="font-body-md text-body-md text-on-surface-variant break-words">
                          {[eq.equipment_brand, eq.equipment_model].filter(Boolean).join(' · ') || '—'}
                          {eq.equipment_serie ? ` · Serie ${eq.equipment_serie}` : ''}
                        </p>
                        <p className="mt-0.5 font-mono text-micro leading-4 tracking-[0.04em] text-on-surface-subtle">
                          Entregado el {formatearFecha(eq.delivery_date)} · {nombrePlanta(eq.location)}
                        </p>
                        {eq.observations && (
                          <p className="font-label-sm text-label-sm text-on-surface-variant break-words">
                            {eq.observations}
                          </p>
                        )}
                      </div>
                      <Link
                        to={`/historial/entrega/${eq.delivery_document_id}`}
                        state={conOrigen(location, empleado.name || 'Colaborador')}
                        className="inline-flex h-7 shrink-0 items-center rounded-full border border-outline-variant bg-white px-2.5 text-meta font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.95]"
                      >
                        Ver entrega #{eq.delivery_document_id}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section data-reveal className="rounded-tarjeta bg-white p-4 shadow-tarjeta md:p-6">
              <h2 className={tituloSeccion}>
                <History className="h-5 w-5 shrink-0 text-on-surface-variant" strokeWidth={1.75} />
                {historial?.length ? `Historial de actas (${historial.length})` : 'Historial de actas'}
              </h2>

              {historial === null ? (
                <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando historial">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-container" />
                  ))}
                </div>
              ) : errorHistorial ? (
                <p className="font-label-sm text-label-sm text-error">
                  No se pudo cargar el historial de actas. Vuelve a entrar para intentarlo de nuevo.
                </p>
              ) : historial.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Todavía no tiene entregas ni devoluciones registradas.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-outline-variant">
                  {historial.map(({ tipo, doc, fecha }) => {
                    const esEntrega = tipo === 'entrega'
                    const Icono = esEntrega ? PackagePlus : Undo2
                    const extravios = esEntrega ? 0 : (doc.items || []).filter((it) => esExtravio(it.observations)).length
                    return (
                      <li key={`${tipo}-${doc.id}`}>
                        <Link
                          to={`/historial/${tipo}/${doc.id}`}
                          state={conOrigen(location, empleado.name || 'Colaborador')}
                          className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition duration-fast ease-standard hover:bg-surface-container-low active:scale-[0.99]"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-container-high text-on-surface">
                            <Icono className="h-4 w-4" strokeWidth={1.75} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body-md text-body-md font-semibold text-on-surface">
                              {esEntrega ? `Entrega #${doc.id}` : `Devolución #${doc.id}`}
                              {esEntrega && doc.status && (
                                <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-outline-variant bg-white px-2.5 text-meta font-medium">
                                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${puntoEstado(doc.status)}`} />
                                  {nombreEstado(doc.status)}
                                </span>
                              )}
                              {extravios > 0 && (
                                <span className="inline-flex h-6 items-center rounded-full bg-error-container px-2.5 text-meta font-medium text-on-error-container">
                                  {extravios === 1 ? '1 extravío' : `${extravios} extravíos`}
                                </span>
                              )}
                            </p>
                            {resumenEquipos(doc.items) && (
                              <p className="break-words font-body-md text-body-md text-on-surface-variant">
                                {resumenEquipos(doc.items)}
                              </p>
                            )}
                            <p className="mt-0.5 font-mono text-micro leading-4 tracking-[0.04em] text-on-surface-subtle">
                              {esEntrega ? 'Entregado' : 'Devuelto'} el {formatearFecha(fecha)}
                              {esEntrega ? ` · ${nombrePlanta(doc.location)}` : ` · de la entrega #${doc.delivery_document_id}`}
                            </p>
                          </div>
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-outline transition duration-base ease-standard group-hover:translate-x-0.5 group-hover:text-on-surface"
                            strokeWidth={1.75}
                          />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo="Editar empleado"
        mensaje={empleado ? `¿Desea editar a "${empleado.name}"?` : ''}
        textoConfirmar="Sí, editar"
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => navigate(`/catalogo/empleados/${id}`, { state: conOrigen(location, empleado?.name || 'Empleado') })}
      />
    </div>
  )
}

export default EmpleadoView
