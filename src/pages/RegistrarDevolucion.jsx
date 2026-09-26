import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArchiveRestore, ArrowLeft, CircleUser, Lock, MessageSquareText, PenLine, Rows3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import FirmaPad from '../components/FirmaPad.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import { SkeletonDetalle } from '../components/Skeleton.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { mostrarToast } from '../components/Toast.jsx'
import { SeccionCard, Campo } from './FormatoActa.jsx'
import { FORMATOS } from '../config/formatos.js'
import {
  obtenerDocumentoEntrega,
  listarDetallesEntrega,
  crearDocumentoDevolucion,
  listarDocumentosDevolucion,
} from '../services/api.js'
import { formatearFecha, formatearFechaHora, constanciaDevolucion } from '../utils/fecha.js'
import useBorradorActa, { claveBorrador, leerBorrador } from '../hooks/useBorradorActa.js'
import { marcarExtravio } from '../utils/extravio.js'
import IsotipoCarga from '../components/IsotipoCarga.jsx'
import EsperaLogo from '../components/EsperaLogo.jsx'
import ActaRegistrada from '../components/ActaRegistrada.jsx'
const formato = FORMATOS.devolucion

// Id de la devolución recién creada, para "Ver acta". Si la respuesta del
// POST no lo trae, es la más reciente de esa entrega (GET /return_documents
// filtrado por entrega, el mismo que ya usa el historial). null si no se
// encuentra: "Ver acta" lleva entonces a la entrega.
async function idDevolucionCreada(token, respuesta, entregaId) {
  const directo = respuesta?.id ?? respuesta?.data?.id ?? respuesta?.return_document?.id
  if (directo) return directo
  try {
    const lista = await listarDocumentosDevolucion(token, { deliveryDocumentId: entregaId })
    const deEsta = (Array.isArray(lista) ? lista : []).filter(
      (d) => d.delivery_document_id == null || String(d.delivery_document_id) === String(entregaId),
    )
    return deEsta.reduce((max, d) => (Number(d.id) > Number(max ?? 0) ? d.id : max), null)
  } catch {
    return null
  }
}

function nombrePlanta(location) {
  if (location === 'Planta Tejar' || location === 'Planta Parramos') return location
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

// Convierte el dataURL (base64) que entrega FirmaPad a un Blob -- mismo
// helper que usa FormatoActa.jsx para /delivery_documents; se repite aquí
// (no se exporta desde allá) porque es una función pura de 8 líneas y así
// no hay que tocar el motor de las 6 hojas para reutilizarla.
function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(',')
  const mime = meta.match(/:(.*?);/)[1]
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

const valorClass =
  'flex h-11 items-center rounded-lg border border-outline-variant bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface'

const inputClass =
  'h-11 w-full rounded-lg border-outline-variant bg-surface-container-lowest px-3.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 transition-colors hover:border-outline focus:border-primary focus:ring-2 focus:ring-primary/25'

const celdaInputClass =
  'w-full border-0 border-b border-transparent bg-transparent p-1 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-0'

/**
 * Registrar una Devolución (POST /return_documents) sobre una entrega ya
 * existente -- "sin entrega no puede haber devolución". Se entra desde el
 * detalle de esa entrega (HistorialEntregaView), que ya sabe el
 * delivery_document_id.
 *
 * La hoja de Devolución (config/formatos.js) ya tenía el diseño y los
 * textos de firmas -- esta pantalla los reutiliza en vez de inventar
 * nuevos, y es la que de verdad los conecta al backend.
 *
 * Puede ser parcial: se listan solo los equipos de esa entrega que
 * todavía no se han devuelto (GET /delivery_document_details?pending=1)
 * y se eligen cuáles regresan.
 */
function RegistrarDevolucion() {
  const { id } = useParams()
  const { token, user, omitirConfirmacion, marcarOmitirConfirmacion } = useAuth()
  const navigate = useNavigate()
  // Se reenvía al volver a la entrega, para que ella siga sabiendo a dónde
  // regresar (utils/origenNavegacion.js).
  const { state: estadoEntrega } = useLocation()

  // Borrador automático (hooks/useBorradorActa.js), uno por entrega: equipos
  // marcados, observaciones y firmas sobreviven a una sesión vencida.
  const claveDelBorrador = claveBorrador(user?.username, 'devolucion', id)
  const [borradorInicial] = useState(() => leerBorrador(claveDelBorrador))
  const inicial = borradorInicial?.datos || {}
  const [avisoBorrador, setAvisoBorrador] = useState(borradorInicial)
  const [confirmandoDescartar, setConfirmandoDescartar] = useState(false)

  const [entrega, setEntrega] = useState(null)
  const [pendientes, setPendientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [seleccion, setSeleccion] = useState({}) // { [detailId]: { marcado, observaciones } }
  const [observacionesGenerales, setObservacionesGenerales] = useState(() =>
    typeof inicial.observacionesGenerales === 'string' ? inicial.observacionesGenerales : '',
  )
  const [firmas, setFirmas] = useState(() => (inicial.firmas && typeof inicial.firmas === 'object' ? inicial.firmas : {}))
  const [guardando, setGuardando] = useState(false)
  // Momento de "devolución registrada": queda abierto con "Ver acta" (la
  // devolución recién creada) y "Cerrar" (vuelve a la entrega, como antes).
  const [devolucionLista, setDevolucionLista] = useState(null)
  const [errorGuardar, setErrorGuardar] = useState('')
  // Igual que en FormatoActa.jsx: confirmación antes de guardar, con su
  // propio "no volver a preguntar en esta sesión".
  const [confirmandoFinalizar, setConfirmandoFinalizar] = useState(false)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    setError('')
    Promise.all([
      obtenerDocumentoEntrega(token, id),
      listarDetallesEntrega(token, { deliveryDocumentId: id, pending: true }),
    ])
      .then(([doc, detalles]) => {
        if (!vivo) return
        setEntrega(doc)
        const lista = Array.isArray(detalles) ? detalles : []
        setPendientes(lista)
        // Lo marcado en el borrador se aplica solo a equipos que siguen
        // pendientes (uno ya devuelto en otra acta no reaparece).
        const previa = inicial.seleccion && typeof inicial.seleccion === 'object' ? inicial.seleccion : {}
        setSeleccion(
          Object.fromEntries(
            lista.map((it) => {
              const p = previa[it.id] || {}
              return [
                it.id,
                {
                  marcado: Boolean(p.marcado),
                  observaciones: typeof p.observaciones === 'string' ? p.observaciones : '',
                  extravio: Boolean(p.extravio),
                },
              ]
            }),
          ),
        )
      })
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar la entrega'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [id, token])

  // Un equipo desmarcado no se envía, así que tampoco puede quedar marcado
  // como extravío: antes la fila seguía roja y con el botón "Extravío"
  // encendido aunque ese equipo ya no iba a registrarse. (El sentido inverso
  // -- activar el extravío fuerza marcado -- está en toggleExtravio.)
  function toggleItem(detailId) {
    setSeleccion((prev) => {
      const actual = prev[detailId] || {}
      const marcado = !actual.marcado
      return {
        ...prev,
        [detailId]: { ...actual, marcado, extravio: marcado ? actual.extravio : false },
      }
    })
  }

  function actualizarObsItem(detailId, valor) {
    setSeleccion((prev) => ({ ...prev, [detailId]: { ...prev[detailId], observaciones: valor } }))
  }

  // Extravío cuenta como devuelto (se marca junto con los demás, tal como se
  // pidió) -- por eso al activarlo también se fuerza `marcado: true`. Al
  // desactivarlo no se desmarca solo, por si el usuario ya lo había marcado
  // aparte antes de usar el botón de extravío.
  function toggleExtravio(detailId) {
    setSeleccion((prev) => {
      const actual = prev[detailId] || {}
      const nuevoExtravio = !actual.extravio
      return {
        ...prev,
        [detailId]: { ...actual, extravio: nuevoExtravio, marcado: nuevoExtravio ? true : actual.marcado },
      }
    })
  }

  const itemsMarcados = pendientes.filter((it) => seleccion[it.id]?.marcado)

  const borrador = useBorradorActa(
    claveDelBorrador,
    { seleccion, observacionesGenerales, firmas },
    {
      // Mientras carga, `seleccion` aún está vacía: no se pisa el borrador.
      activo: !cargando && !error && !devolucionLista,
      conContenido: Boolean(
        observacionesGenerales.trim() ||
          firmas.entrega ||
          firmas.recibe ||
          Object.values(seleccion).some((v) => v?.marcado || v?.observaciones?.trim()),
      ),
    },
  )

  function descartarBorrador() {
    borrador.descartar()
    setSeleccion((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, { marcado: false, observaciones: '', extravio: false }])),
    )
    setObservacionesGenerales('')
    setFirmas({})
    setErrorGuardar('')
    setAvisoBorrador(null)
    setConfirmandoDescartar(false)
  }

  function validarDevolucion() {
    setErrorGuardar('')
    if (itemsMarcados.length === 0) {
      setErrorGuardar('Selecciona al menos un equipo que se esté devolviendo.')
      return false
    }
    if (!firmas.entrega || !firmas.recibe) {
      setErrorGuardar('Faltan firmas por confirmar.')
      return false
    }
    return true
  }

  function handleClicFinalizarDevolucion() {
    if (!validarDevolucion()) return
    if (omitirConfirmacion.devolucion) {
      handleFinalizarDevolucion()
      return
    }
    setConfirmandoFinalizar(true)
  }

  function handleConfirmarFinalizarDevolucion(_password, noPreguntar) {
    if (noPreguntar) marcarOmitirConfirmacion('devolucion')
    setConfirmandoFinalizar(false)
    handleFinalizarDevolucion()
  }

  async function handleFinalizarDevolucion() {
    setGuardando(true)
    try {
      const formData = new FormData()
      formData.append('delivery_document_id', id)
      if (observacionesGenerales.trim()) formData.append('observations', observacionesGenerales.trim())
      formData.append('responsable_signature', dataUrlToBlob(firmas.entrega), 'responsable.png')
      formData.append('administrador_signature', dataUrlToBlob(firmas.recibe), 'administrador.png')
      itemsMarcados.forEach((item, indice) => {
        formData.append(`items[${indice}][delivery_document_detail_id]`, item.id)
        const itemSeleccion = seleccion[item.id]
        const obs = itemSeleccion?.extravio
          ? marcarExtravio(itemSeleccion.observaciones)
          : itemSeleccion?.observaciones?.trim()
        if (obs) formData.append(`items[${indice}][observations]`, obs)
      })
      const respuesta = await crearDocumentoDevolucion(token, formData)
      borrador.limpiar()
      const nuevoId = await idDevolucionCreada(token, respuesta, id)
      setDevolucionLista({ id: nuevoId })
    } catch (err) {
      setErrorGuardar(err.message || 'No se pudo guardar la devolución')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex-1 [&+footer]:pb-[calc(114px+env(safe-area-inset-bottom))] md:[&+footer]:pb-[88px]">
      <div className="px-4 pt-6 pb-10 tablet:px-8 tablet:pt-8 md:px-8 md:pt-10">
        <div className="mx-auto max-w-4xl animate-view-in space-y-stack-lg">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-5">
            <Link
              to={`/historial/entrega/${id}`}
              state={estadoEntrega}
              className="inline-flex h-9 items-center gap-2 rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              Entrega
            </Link>
            <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
              <span aria-hidden="true" className="h-px w-7 bg-outline" />
              Historial / Devolución / Registrar
            </div>
          </div>

          {/* Borrador recuperado (sesión vencida, pestaña cerrada, recarga). */}
          {!cargando && !error && entrega && avisoBorrador && (
            <div
              role="status"
              className="animate-pop-in flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-tarjeta border border-available/30 bg-white px-4 py-3 shadow-tarjeta md:px-5"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-available-container text-on-available-container">
                  <ArchiveRestore className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="font-body-md text-body-md font-semibold text-on-surface">
                    Recuperamos la devolución que estabas llenando
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Guardada automáticamente
                    {avisoBorrador.guardadoEn ? ` el ${formatearFechaHora(avisoBorrador.guardadoEn)}` : ''}. Revisa y finaliza cuando esté lista.
                  </p>
                </div>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setConfirmandoDescartar(true)}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97] sm:flex-none"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={() => setAvisoBorrador(null)}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-boton bg-tinta px-3 font-body-md text-body-md font-medium text-white transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97] sm:flex-none"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {cargando ? (
            // Misma forma que la hoja que aparece al terminar de cargar (igual
            // que HistorialEntregaView), en vez de una rueda girando.
            <SkeletonDetalle secciones={3} camposPorSeccion={3} />
          ) : error || !entrega ? (
            <div className="rounded-tarjeta bg-white shadow-tarjeta">
              <EstadoVacio
                variante="error"
                titulo="No se pudo cargar la entrega"
                descripcion={error || 'Es posible que esta entrega ya se haya eliminado.'}
                accion={
                  <Link
                    to="/historial/entrega"
                    className="inline-flex h-10 items-center justify-center rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
                  >
                    Volver al historial
                  </Link>
                }
              />
            </div>
          ) : (
            <>
              {/* Membrete -- mismo bloque que las demás hojas */}
              <div className="overflow-hidden rounded-tarjeta bg-white shadow-tarjeta">
                <div className="flex flex-wrap items-start justify-between gap-column-gap p-stack-lg">
                  <div className="flex items-start gap-stack-md">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-outline-variant bg-surface-container-lowest p-1.5">
                      <img
                        src="/logo-legumex-icon.png"
                        alt="Agroindustria Legumex"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                        Agroindustria Legumex, S.A.
                      </p>
                      <h2 className="mt-1 font-papel text-titulo-papel text-on-surface">
                        {formato.titulo}
                      </h2>
                      <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                        Departamento de Tecnologías de la Información
                      </p>
                    </div>
                  </div>

                  <dl className="grid shrink-0 grid-cols-[auto_auto] items-baseline gap-x-4 gap-y-1.5 text-right">
                    <dt className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
                      Código
                    </dt>
                    <dd className="font-mono text-label-bold text-on-surface">{formato.codigo}</dd>
                    <dt className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
                      Entrega de origen
                    </dt>
                    <dd className="font-label-bold text-label-bold text-on-surface">#{id}</dd>
                  </dl>
                </div>
              </div>

              {/* Datos de la entrega -- solo lectura, viene de la entrega original */}
              <SeccionCard icon={CircleUser} titulo="Datos del Usuario">
                <div className="grid grid-cols-12 gap-x-column-gap gap-y-stack-md p-5">
                  <Campo label="Fecha de Entrega">
                    <div className={valorClass}>{formatearFecha(entrega.delivery_date)}</div>
                  </Campo>
                  <Campo label="Colaborador" span="col-span-12 sm:col-span-8">
                    <div className={valorClass}>{entrega.employee_name || '—'}</div>
                  </Campo>
                  <Campo label="Departamento">
                    <div className={valorClass}>{entrega.employee_department || '—'}</div>
                  </Campo>
                  <Campo label="Planta">
                    <div className={valorClass}>{nombrePlanta(entrega.location)}</div>
                  </Campo>
                </div>
              </SeccionCard>

              {/* Equipo pendiente de devolver */}
              <SeccionCard
                icon={Rows3}
                titulo={formato.tituloTablaCorta}
                acciones={
                  itemsMarcados.length > 0 && (
                    <span
                      key={itemsMarcados.length}
                      className="inline-flex h-6 animate-badge-pop items-center gap-1.5 rounded-full border border-outline-variant bg-white px-2.5 font-mono text-micro tabular-nums text-on-surface-variant"
                    >
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-on-surface" />
                      {itemsMarcados.length} seleccionado{itemsMarcados.length === 1 ? '' : 's'}
                    </span>
                  )
                }
              >
                {pendientes.length === 0 ? (
                  <div className="p-1">
                    <EstadoVacio
                      icon={formato.icon}
                      titulo="Ya no hay equipo pendiente de devolver"
                      descripcion="Todo el equipo de esta entrega ya fue devuelto."
                    />
                  </div>
                ) : (
                  <>
                  {/* Escritorio y tablet: tabla, sin cambios */}
                  <div className="hidden md:block w-full overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-outline-variant bg-surface-container-low">
                          <th className="w-12 py-2.5 pl-5 pr-3" />
                          {['Equipo', 'Marca', 'Modelo', 'No. Serie', 'Observaciones de la devolución'].map((col) => (
                            <th
                              key={col}
                              className="py-2.5 pr-3 font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant"
                            >
                              {col}
                            </th>
                          ))}
                          <th className="py-2.5 pr-5 font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
                            Extravío
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendientes.map((item) => {
                          const marcado = Boolean(seleccion[item.id]?.marcado)
                          const extravio = Boolean(seleccion[item.id]?.extravio)
                          return (
                            <tr
                              key={item.id}
                              className={`border-b border-outline-variant transition-colors ${
                                extravio ? 'bg-error-container/30' : marcado ? 'bg-primary/5' : ''
                              }`}
                            >
                              <td className="py-2 pl-5 pr-3">
                                <input
                                  type="checkbox"
                                  checked={marcado}
                                  onChange={() => toggleItem(item.id)}
                                  className="h-4.5 w-4.5 rounded border-outline-variant text-primary focus:ring-primary/25"
                                />
                              </td>
                              <td className="py-2 pr-3 font-medium text-on-surface break-words">
                                {item.equipment_name || '—'}
                              </td>
                              <td className="py-2 pr-3 text-on-surface-variant break-words">{item.equipment_brand || '—'}</td>
                              <td className="py-2 pr-3 text-on-surface-variant break-words">{item.equipment_model || '—'}</td>
                              <td className="py-2 pr-3 font-mono uppercase text-on-surface-variant">
                                {item.equipment_serie || '—'}
                              </td>
                              <td className="py-2 pr-3">
                                <input
                                  type="text"
                                  value={seleccion[item.id]?.observaciones || ''}
                                  onChange={(e) => actualizarObsItem(item.id, e.target.value)}
                                  disabled={!marcado}
                                  placeholder={extravio ? 'Ej. No tuvo devolución' : 'Ej. Regresa en buen estado'}
                                  className={`${celdaInputClass} disabled:opacity-50`}
                                />
                              </td>
                              <td className="py-2 pr-5">
                                <button
                                  type="button"
                                  onClick={() => toggleExtravio(item.id)}
                                  title="Marcar este equipo como extravío (no hubo devolución real)"
                                  className={[
                                    'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 font-label-sm text-label-sm font-bold uppercase tracking-wide transition-colors active:scale-[0.90] transition-transform',
                                    extravio
                                      ? 'border-error bg-error text-on-error'
                                      : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-error-container/40 hover:text-on-error-container',
                                  ].join(' ')}
                                >
                                  Extravío
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Móvil: una tarjeta por artículo pendiente; se toca la
                      tarjeta completa para marcar/desmarcar, igual que otras
                      listas seleccionables del sistema. */}
                  <div className="flex flex-col gap-stack-sm p-4 md:hidden">
                    {pendientes.map((item) => {
                      const marcado = Boolean(seleccion[item.id]?.marcado)
                      const extravio = Boolean(seleccion[item.id]?.extravio)
                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-4 transition-colors ${
                            extravio
                              ? 'border-error bg-error-container/30'
                              : marcado
                                ? 'border-primary bg-primary/5'
                                : 'border-outline-variant bg-surface-container-lowest'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            className="flex w-full items-start gap-3 text-left active:scale-[0.99] transition-transform"
                          >
                            {/* Decorativo a propósito: quien maneja el toque es
                                el <button> que envuelve toda la tarjeta. Antes
                                este input tenía su propio onChange y, al tocar
                                justo la casilla, se disparaban los dos
                                manejadores: el estado se invertía dos veces y
                                el equipo NO quedaba marcado. */}
                            <input
                              type="checkbox"
                              checked={marcado}
                              readOnly
                              tabIndex={-1}
                              aria-hidden="true"
                              className="pointer-events-none mt-0.5 h-4.5 w-4.5 shrink-0 rounded border-outline-variant text-primary focus:ring-primary/25"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-label-bold text-label-bold text-on-surface break-words">
                                {item.equipment_name || '—'}
                              </p>
                              <p className="font-body-md text-body-md text-on-surface-variant break-words">
                                {item.equipment_brand || '—'} · {item.equipment_model || '—'}
                                {item.equipment_serie ? ` · ${item.equipment_serie}` : ''}
                              </p>
                            </div>
                          </button>

                          {marcado && (
                            <div className="mt-stack-sm flex flex-col gap-1.5 pl-7">
                              <label className="font-label-bold text-label-bold text-on-surface">
                                Observaciones de la devolución
                              </label>
                              <input
                                type="text"
                                value={seleccion[item.id]?.observaciones || ''}
                                onChange={(e) => actualizarObsItem(item.id, e.target.value)}
                                placeholder={extravio ? 'Ej. No tuvo devolución' : 'Ej. Regresa en buen estado'}
                                className={inputClass}
                              />
                            </div>
                          )}

                          <div className="mt-stack-sm pl-7">
                            <button
                              type="button"
                              onClick={() => toggleExtravio(item.id)}
                              className={[
                                'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3.5 font-label-sm text-label-sm font-bold uppercase tracking-wide transition-colors active:scale-[0.90] transition-transform',
                                extravio
                                  ? 'border-error bg-error text-on-error'
                                  : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-error-container/40 hover:text-on-error-container',
                              ].join(' ')}
                            >
                              Extravío
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  </>
                )}
              </SeccionCard>

              {/* Constancia de devolución -- mismo texto de la hoja física,
                  con el día/mes/año de hoy ya resueltos (se guardará con esa
                  misma fecha real al finalizar) en vez de dejarlos en blanco. */}
              <SeccionCard icon={Lock} titulo={formato.tituloClausula} nota="Texto fijo del formato">
                <div className="p-5">
                  <p className="border-l-2 border-outline-variant pl-4 font-body-md text-body-md leading-relaxed text-pretty text-on-surface">
                    {constanciaDevolucion(new Date())}
                  </p>
                </div>
              </SeccionCard>

              {/* Observaciones generales */}
              <SeccionCard
                icon={MessageSquareText}
                titulo="Observaciones Generales"
                acciones={
                  <span className="font-label-sm text-label-sm tabular-nums text-on-surface-variant">
                    Opcional · {observacionesGenerales.length}/500
                  </span>
                }
              >
                <div className="p-5">
                  <textarea
                    value={observacionesGenerales}
                    maxLength={500}
                    onChange={(e) => setObservacionesGenerales(e.target.value)}
                    placeholder={formato.placeholderObs}
                    className="min-h-24 w-full resize-y rounded-lg border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 transition-colors hover:border-outline focus:border-primary focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </SeccionCard>

              {/* Firmas -- mismos textos ya definidos en la hoja de Devolución */}
              <SeccionCard icon={PenLine} titulo={formato.tituloFirmas}>
                <div className="grid grid-cols-1 gap-stack-lg p-stack-lg sm:grid-cols-2">
                  {formato.firmas.map((firma) => (
                    <FirmaPad
                      key={firma.key}
                      titulo={firma.titulo}
                      subtitulo={firma.subtitulo}
                      firmaUrl={firmas[firma.key] ?? null}
                      onConfirmar={(dataUrl) => setFirmas((prev) => ({ ...prev, [firma.key]: dataUrl }))}
                      onReiniciar={() =>
                        setFirmas((prev) => {
                          const copia = { ...prev }
                          delete copia[firma.key]
                          return copia
                        })
                      }
                    />
                  ))}
                </div>
              </SeccionCard>
            </>
          )}
        </div>
      </div>

      {!cargando && !error && entrega && (
        <div data-barra-inferior className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:left-drawer-width md:overflow-hidden md:px-8 md:pb-3 md:[scrollbar-gutter:stable]">
          <div className="[&>*]:pointer-events-auto mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
            {errorGuardar ? (
              <p className="animate-pop-in rounded-boton border border-error/30 bg-error-container px-3 py-2 font-label-sm text-label-sm text-error">
                {errorGuardar}
              </p>
            ) : (
              <span className="rounded-full border border-outline-variant bg-papel px-3 py-1 font-mono text-micro uppercase tracking-[0.1em] text-on-surface-variant">
                Complete los datos para guardar
              </span>
            )}
            <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto">
              <Link
                to={`/historial/entrega/${id}`}
                state={estadoEntrega}
                // Cancelar es abandonar la hoja a propósito: sin borrador.
                onClick={() => borrador.limpiar()}
                className="inline-flex flex-1 sm:flex-none h-10 items-center justify-center rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-toast transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
              >
                Cancelar
              </Link>
              <button
                type="button"
                onClick={handleClicFinalizarDevolucion}
                disabled={guardando || pendientes.length === 0}
                className="inline-flex flex-1 sm:flex-none h-10 items-center justify-center gap-2 rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-toast transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando && <IsotipoCarga className="h-3 movil:!hidden" />}
                {formato.textoAccion}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={confirmandoFinalizar}
        titulo="Finalizar devolución"
        mensaje="¿Confirmas que los datos y las firmas son correctos? Se guardará como una devolución registrada."
        textoConfirmar="Sí, finalizar"
        permitirNoPreguntar
        procesando={guardando}
        onCancelar={() => {
          if (guardando) return
          setConfirmandoFinalizar(false)
        }}
        onConfirmar={handleConfirmarFinalizarDevolucion}
      />

      {!devolucionLista && <EsperaLogo activa={guardando} mensaje="Guardando devolución…" />}
      {devolucionLista && (
        <ActaRegistrada
          codigo="DEV-EQ-01 · REGISTRADA"
          titulo="Devolución registrada"
          detalle={entrega?.employee_name}
          acciones={{
            ver: () =>
              devolucionLista.id
                ? navigate(`/historial/devolucion/${devolucionLista.id}`, {
                    replace: true,
                    state: { origen: { ruta: `/historial/entrega/${id}`, etiqueta: `Entrega #${id}` } },
                  })
                : navigate(`/historial/entrega/${id}`, { replace: true, state: estadoEntrega }),
            cerrar: () => {
              mostrarToast('Devolución registrada')
              navigate(`/historial/entrega/${id}`, { replace: true, state: estadoEntrega })
            },
          }}
        />
      )}

      <ConfirmDialog
        abierto={confirmandoDescartar}
        titulo="Descartar borrador"
        mensaje="Se quitarán los equipos marcados, las observaciones y las firmas. ¿Deseas empezar de cero?"
        textoConfirmar="Sí, descartar"
        onCancelar={() => setConfirmandoDescartar(false)}
        onConfirmar={descartarBorrador}
      />
    </div>
  )
}

export default RegistrarDevolucion
