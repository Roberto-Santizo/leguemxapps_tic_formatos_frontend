import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CircleUser, Loader2, MessageSquareText, PenLine, Rows3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import FirmaPad from '../components/FirmaPad.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import { mostrarToast } from '../components/Toast.jsx'
import { SeccionCard, Campo } from './FormatoActa.jsx'
import { FORMATOS } from '../config/formatos.js'
import { obtenerDocumentoEntrega, listarDetallesEntrega, crearDocumentoDevolucion } from '../services/api.js'

const formato = FORMATOS.devolucion

function nombrePlanta(location) {
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
 * todavía no se han devuelto (GET /delivery_document_details?pending=true)
 * y se eligen cuáles regresan.
 */
function RegistrarDevolucion() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [entrega, setEntrega] = useState(null)
  const [pendientes, setPendientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [seleccion, setSeleccion] = useState({}) // { [detailId]: { marcado, observaciones } }
  const [observacionesGenerales, setObservacionesGenerales] = useState('')
  const [firmas, setFirmas] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')

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
        setSeleccion(
          Object.fromEntries(lista.map((it) => [it.id, { marcado: false, observaciones: '' }])),
        )
      })
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar la entrega'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [id, token])

  function toggleItem(detailId) {
    setSeleccion((prev) => ({
      ...prev,
      [detailId]: { ...prev[detailId], marcado: !prev[detailId]?.marcado },
    }))
  }

  function actualizarObsItem(detailId, valor) {
    setSeleccion((prev) => ({ ...prev, [detailId]: { ...prev[detailId], observaciones: valor } }))
  }

  const itemsMarcados = pendientes.filter((it) => seleccion[it.id]?.marcado)

  async function handleFinalizarDevolucion() {
    setErrorGuardar('')
    if (itemsMarcados.length === 0) {
      setErrorGuardar('Selecciona al menos un equipo que se esté devolviendo.')
      return
    }
    if (!firmas.entrega || !firmas.recibe) {
      setErrorGuardar('Faltan firmas por confirmar.')
      return
    }

    setGuardando(true)
    try {
      const formData = new FormData()
      formData.append('delivery_document_id', id)
      if (observacionesGenerales.trim()) formData.append('observations', observacionesGenerales.trim())
      formData.append('responsable_signature', dataUrlToBlob(firmas.entrega), 'responsable.png')
      formData.append('administrador_signature', dataUrlToBlob(firmas.recibe), 'administrador.png')
      itemsMarcados.forEach((item, indice) => {
        formData.append(`items[${indice}][delivery_document_detail_id]`, item.id)
        const obs = seleccion[item.id]?.observaciones?.trim()
        if (obs) formData.append(`items[${indice}][observations]`, obs)
      })
      await crearDocumentoDevolucion(token, formData)
      mostrarToast('Devolución registrada')
      navigate(`/historial/entrega/${id}`)
    } catch (err) {
      setErrorGuardar(err.message || 'No se pudo guardar la devolución')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex-1 animate-view-in">
      <div className="p-container-padding md:p-8">
        <div className="mx-auto max-w-4xl space-y-stack-lg pb-4">
          <Link
            to={`/historial/entrega/${id}`}
            className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Entrega
          </Link>

          {cargando ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-14 justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-outline" strokeWidth={2} />
              <span className="font-body-md text-body-md text-on-surface-variant">Cargando entrega...</span>
            </div>
          ) : error || !entrega ? (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
              <EstadoVacio
                variante="error"
                titulo="No se pudo cargar la entrega"
                descripcion={error || 'Es posible que esta entrega ya se haya eliminado.'}
                accion={
                  <Link
                    to="/historial/entrega"
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
                  >
                    Volver al historial
                  </Link>
                }
              />
            </div>
          ) : (
            <>
              {/* Membrete -- mismo bloque que las demás hojas */}
              <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
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
                      <h2 className="mt-1 font-headline-lg text-headline-lg font-extrabold text-on-surface">
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
                    <div className={valorClass}>{entrega.delivery_date || '—'}</div>
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
                    <span className="rounded-full border border-outline-variant px-2 py-0.5 font-mono text-label-sm tabular-nums text-on-surface-variant">
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
                  <div className="w-full overflow-x-auto">
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
                        </tr>
                      </thead>
                      <tbody>
                        {pendientes.map((item) => {
                          const marcado = Boolean(seleccion[item.id]?.marcado)
                          return (
                            <tr
                              key={item.id}
                              className={`border-b border-outline-variant transition-colors ${marcado ? 'bg-primary/5' : ''}`}
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
                              <td className="py-2 pr-5">
                                <input
                                  type="text"
                                  value={seleccion[item.id]?.observaciones || ''}
                                  onChange={(e) => actualizarObsItem(item.id, e.target.value)}
                                  disabled={!marcado}
                                  placeholder="Ej. Regresa en buen estado"
                                  className={`${celdaInputClass} disabled:opacity-50`}
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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
        <div className="sticky bottom-0 z-30 border-t border-outline-variant bg-surface-container-lowest px-container-padding py-3 shadow-sm md:px-8">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
            {errorGuardar ? (
              <p className="font-label-sm text-label-sm text-error rounded-lg border border-error/30 bg-error-container/40 px-3 py-2">
                {errorGuardar}
              </p>
            ) : (
              <span className="font-label-bold text-label-bold text-on-surface-variant">
                Complete los datos para guardar
              </span>
            )}
            <div className="flex items-center gap-3">
              <Link
                to={`/historial/entrega/${id}`}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-6 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                Cancelar
              </Link>
              <button
                type="button"
                onClick={handleFinalizarDevolucion}
                disabled={guardando || pendientes.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-label-bold text-label-bold text-on-primary shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                {formato.textoAccion}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegistrarDevolucion
