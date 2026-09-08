import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CircleUser,
  Download,
  ExternalLink,
  Loader2,
  MessageSquareText,
  PenLine,
  PlusCircle,
  Rows3,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import InlineEditableText from '../components/InlineEditableText.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'
import { mostrarToast } from '../components/Toast.jsx'
import { SkeletonDetalle } from '../components/Skeleton.jsx'
import { SeccionCard, Campo } from './FormatoActa.jsx'
import { FORMATOS } from '../config/formatos.js'
import {
  obtenerDocumentoDevolucion,
  actualizarDocumentoDevolucion,
  actualizarDetalleDevolucion,
  agregarDetalleDevolucion,
  listarDetallesEntrega,
  urlArchivoPublico,
} from '../services/api.js'
import { generarPdfPapelFisico } from '../utils/generatePdfPapelFisico.js'
import { construirHtmlDevolucion } from '../pdf/plantillaDevolucion.js'

const formato = FORMATOS.devolucion

function nombrePlanta(location) {
  if (location === 'Planta Tejar' || location === 'Planta Parramos') return location
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

const valorClass =
  'flex h-11 items-center rounded-lg border border-outline-variant bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface'

/**
 * Firma guardada en el storage -- mismo comportamiento que
 * HistorialEntregaView.jsx: si la imagen no carga, se muestra "Sin firma"
 * en vez del ícono de imagen rota del navegador.
 */
function FirmaImagen({ url, alt }) {
  const [fallo, setFallo] = useState(false)
  if (!url || fallo) {
    return (
      <span className="font-label-sm text-label-sm text-on-surface-variant">
        {url ? 'Firma no disponible' : 'Sin firma'}
      </span>
    )
  }
  return <img src={url} alt={alt} onError={() => setFallo(true)} className="max-h-full max-w-full object-contain" />
}

/**
 * Detalle de un Documento de Devolución (GET /return_documents/{id}) --
 * destino del ojo/tarjeta en HistorialDevolucionList. Solo lectura salvo las
 * observaciones (generales y por equipo), que sí se pueden corregir --
 * es lo único que permite la API sobre una devolución ya firmada.
 */
function HistorialDevolucionView() {
  const { id } = useParams()
  const { token } = useAuth()
  const hojaRef = useRef(null)

  const [documento, setDocumento] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [generandoPdf, setGenerandoPdf] = useState(false)

  // --- Completar una devolución ya firmada: agregar un equipo pendiente de
  // la misma entrega que se quedó fuera (POST /return_document_details) ---
  const [agregandoEquipo, setAgregandoEquipo] = useState(false)
  const [pendientes, setPendientes] = useState([])
  const [nuevoDetalleId, setNuevoDetalleId] = useState('')
  const [nuevoDetalleObs, setNuevoDetalleObs] = useState('')
  const [guardandoEquipo, setGuardandoEquipo] = useState(false)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    setError('')
    obtenerDocumentoDevolucion(token, id)
      .then((data) => vivo && setDocumento(data))
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el documento de devolución'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [id, token])

  function recargar() {
    return obtenerDocumentoDevolucion(token, id).then((data) => setDocumento(data))
  }

  // Lo que se puede agregar a ESTA devolución es el equipo que sigue
  // pendiente de la misma entrega de origen (todavía no se devolvió en
  // ningún documento) -- se reutiliza el mismo listado que arma la pantalla
  // de "Registrar devolución", no un catálogo aparte.
  function abrirAgregarEquipo() {
    setAgregandoEquipo(true)
    listarDetallesEntrega(token, { deliveryDocumentId: documento.delivery_document_id, pending: true })
      .then((data) => setPendientes(Array.isArray(data) ? data : []))
      .catch(() => setPendientes([]))
  }

  function cancelarAgregarEquipo() {
    setAgregandoEquipo(false)
    setNuevoDetalleId('')
    setNuevoDetalleObs('')
  }

  async function confirmarAgregarEquipo() {
    if (!nuevoDetalleId) return
    setGuardandoEquipo(true)
    try {
      await agregarDetalleDevolucion(token, {
        return_document_id: Number(id),
        delivery_document_detail_id: Number(nuevoDetalleId),
        observations: nuevoDetalleObs.trim() || undefined,
      })
      await recargar()
      mostrarToast('Equipo agregado a la devolución')
      cancelarAgregarEquipo()
    } catch (err) {
      mostrarToast(err.message || 'No se pudo agregar el equipo', { tipo: 'error' })
    } finally {
      setGuardandoEquipo(false)
    }
  }

  async function corregirObservacionGeneral(observations) {
    try {
      await actualizarDocumentoDevolucion(token, id, { observations })
      setDocumento((doc) => ({ ...doc, observations }))
      mostrarToast('Observación actualizada')
    } catch (err) {
      mostrarToast(err.message || 'No se pudo corregir la observación', { tipo: 'error' })
    }
  }

  async function corregirObservacionItem(itemId, observations) {
    try {
      await actualizarDetalleDevolucion(token, itemId, { observations })
      setDocumento((doc) => ({
        ...doc,
        items: doc.items.map((it) => (it.id === itemId ? { ...it, observations } : it)),
      }))
      mostrarToast('Observación actualizada')
    } catch (err) {
      mostrarToast(err.message || 'No se pudo corregir la observación', { tipo: 'error' })
    }
  }

  async function handleDescargarPdf() {
    if (!documento) return
    setGenerandoPdf(true)
    try {
      const html = construirHtmlDevolucion(documento, formato, {
        entrega: urlArchivoPublico(documento.responsable_signature),
        recibe: urlArchivoPublico(documento.administrador_signature),
      })
      await generarPdfPapelFisico(html, `devolucion-equipo-${id}.pdf`)
    } catch {
      mostrarToast('No se pudo generar el PDF', { tipo: 'error' })
    } finally {
      setGenerandoPdf(false)
    }
  }

  return (
    <div className="flex-1 animate-view-in">
      <div className="p-container-padding md:p-8">
        <div className="mx-auto max-w-4xl space-y-stack-lg pb-4">
          <Link
            to="/historial/devolucion"
            className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Devolución de Equipo
          </Link>

          {cargando ? (
            <SkeletonDetalle secciones={3} camposPorSeccion={3} />
          ) : error || !documento ? (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
              <EstadoVacio
                variante="error"
                titulo={error ? 'No se pudo cargar el documento' : 'Documento no encontrado'}
                descripcion={error || 'Es posible que esta devolución ya no exista.'}
                accion={
                  <Link
                    to="/historial/devolucion"
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
                  >
                    Volver al historial
                  </Link>
                }
              />
            </div>
          ) : (
            <div ref={hojaRef} className="space-y-stack-lg">
              {/* Membrete */}
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
                      Registrado por
                    </dt>
                    <dd className="font-label-bold text-label-bold text-on-surface">{documento.user_name || '—'}</dd>
                  </dl>
                </div>
              </div>

              {/* Datos del usuario */}
              <SeccionCard icon={CircleUser} titulo="Datos del Usuario">
                <div className="grid grid-cols-12 gap-x-column-gap gap-y-stack-md p-5">
                  <Campo label="Fecha de Devolución">
                    <div className={valorClass}>{documento.return_date || '—'}</div>
                  </Campo>
                  <Campo label="Colaborador" span="col-span-12 sm:col-span-8">
                    <div className={valorClass}>{documento.employee_name || '—'}</div>
                  </Campo>
                  <Campo label="Departamento">
                    <div className={valorClass}>{documento.employee_department || '—'}</div>
                  </Campo>
                  <Campo label="Planta">
                    <div className={valorClass}>{nombrePlanta(documento.location)}</div>
                  </Campo>
                  <Campo label="Entrega de origen" span="col-span-12 sm:col-span-4">
                    <Link
                      to={`/historial/entrega/${documento.delivery_document_id}`}
                      className="flex h-11 items-center justify-between gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface transition-colors hover:bg-surface-container-high"
                    >
                      Ver entrega #{documento.delivery_document_id}
                      <ExternalLink className="h-4 w-4 shrink-0 text-on-surface-variant" strokeWidth={2} />
                    </Link>
                  </Campo>
                </div>
              </SeccionCard>

              {/* Tabla de equipo devuelto */}
              <SeccionCard
                icon={Rows3}
                titulo="Equipo Devuelto"
                acciones={
                  <button
                    type="button"
                    onClick={abrirAgregarEquipo}
                    disabled={agregandoEquipo}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50 active:scale-[0.97] transition-transform"
                  >
                    <PlusCircle className="h-4 w-4" strokeWidth={2} />
                    Agregar equipo
                  </button>
                }
              >
                {(!documento.items || documento.items.length === 0) && !agregandoEquipo ? (
                  <div className="flex flex-col items-center gap-1.5 px-5 py-10 text-center">
                    <p className="font-label-bold text-label-bold text-on-surface">Sin equipo registrado</p>
                  </div>
                ) : (
                  <>
                  {/* Escritorio y tablet: tabla, sin cambios */}
                  <div className="hidden md:block w-full overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-outline-variant bg-surface-container-low">
                          <th className="w-14 py-2.5 pl-5 pr-3 text-right font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
                            No.
                          </th>
                          {['Equipo', 'Marca', 'Modelo', 'No. Serie', 'Observaciones'].map((col) => (
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
                        {documento.items.map((item, indice) => (
                          <tr key={item.id} className="border-b border-outline-variant">
                            <td className="py-2 pl-5 pr-3 text-right font-mono text-body-md tabular-nums text-on-surface-variant">
                              {String(indice + 1).padStart(2, '0')}
                            </td>
                            <td className="py-2 pr-3 font-medium text-on-surface break-words">
                              {item.equipment_name || '—'}
                            </td>
                            <td className="py-2 pr-3 text-on-surface-variant break-words">{item.equipment_brand || '—'}</td>
                            <td className="py-2 pr-3 text-on-surface-variant break-words">{item.equipment_model || '—'}</td>
                            <td className="py-2 pr-3 font-mono uppercase text-on-surface-variant">
                              {item.equipment_serie || '—'}
                            </td>
                            <td className="py-2 pr-5 text-on-surface-variant break-words">
                              <InlineEditableText
                                value={item.observations || 'Sin observaciones'}
                                onChange={(valor) => corregirObservacionItem(item.id, valor)}
                                title="Corregir observación"
                              />
                            </td>
                          </tr>
                        ))}

                        {agregandoEquipo && (
                          <tr className="border-b border-outline-variant bg-surface-container-low/40">
                            <td className="py-2 pl-5 pr-3" />
                            <td className="py-2 pr-3" colSpan={3}>
                              <SearchableSelect
                                options={pendientes.map((it) => ({
                                  id: it.id,
                                  name: it.equipment_brand ? `${it.equipment_name} — ${it.equipment_brand}` : it.equipment_name,
                                }))}
                                value={nuevoDetalleId}
                                onChange={setNuevoDetalleId}
                                disabled={guardandoEquipo}
                                placeholder="Selecciona el equipo pendiente"
                                emptyOptionsText="Ya no queda equipo pendiente de esta entrega."
                              />
                            </td>
                            <td className="py-2 pr-3" colSpan={2}>
                              <input
                                type="text"
                                value={nuevoDetalleObs}
                                onChange={(e) => setNuevoDetalleObs(e.target.value)}
                                placeholder="Observaciones (opcional)"
                                disabled={guardandoEquipo}
                                className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                              />
                            </td>
                            <td className="py-2 pr-5">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={confirmarAgregarEquipo}
                                  disabled={guardandoEquipo || !nuevoDetalleId}
                                  aria-label="Confirmar equipo"
                                  title="Confirmar"
                                  className="grid h-8 w-8 place-items-center rounded-lg text-primary transition-colors hover:bg-primary/10 disabled:opacity-40 active:scale-[0.97] transition-transform"
                                >
                                  {guardandoEquipo ? (
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                                  ) : (
                                    <Check className="h-4 w-4" strokeWidth={2.5} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelarAgregarEquipo}
                                  disabled={guardandoEquipo}
                                  aria-label="Cancelar"
                                  title="Cancelar"
                                  className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
                                >
                                  <X className="h-4 w-4" strokeWidth={2} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Móvil: una tarjeta por artículo devuelto. */}
                  <div className="flex flex-col gap-stack-sm p-4 md:hidden">
                    {documento.items.map((item, indice) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
                      >
                        <div className="mb-stack-sm flex items-center gap-2">
                          <span className="shrink-0 font-mono text-body-md tabular-nums text-on-surface-variant">
                            {String(indice + 1).padStart(2, '0')}
                          </span>
                          <span className="font-label-bold text-label-bold text-on-surface break-words">
                            {item.equipment_name || '—'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                              Marca
                            </p>
                            <p className="font-body-md text-body-md text-on-surface break-words">
                              {item.equipment_brand || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                              Modelo
                            </p>
                            <p className="font-body-md text-body-md text-on-surface break-words">
                              {item.equipment_model || '—'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                              No. Serie
                            </p>
                            <p className="font-mono text-body-md uppercase text-on-surface">
                              {item.equipment_serie || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-stack-sm">
                          <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                            Observaciones
                          </p>
                          <InlineEditableText
                            value={item.observations || 'Sin observaciones'}
                            onChange={(valor) => corregirObservacionItem(item.id, valor)}
                            title="Corregir observación"
                          />
                        </div>
                      </div>
                    ))}

                    {agregandoEquipo && (
                      <div className="rounded-xl border border-dashed border-outline bg-surface-container-low/40 p-4">
                        <div className="flex flex-col gap-stack-sm">
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-bold text-label-bold text-on-surface">Equipo</label>
                            <SearchableSelect
                              options={pendientes.map((it) => ({
                                id: it.id,
                                name: it.equipment_brand ? `${it.equipment_name} — ${it.equipment_brand}` : it.equipment_name,
                              }))}
                              value={nuevoDetalleId}
                              onChange={setNuevoDetalleId}
                              disabled={guardandoEquipo}
                              placeholder="Selecciona el equipo pendiente"
                              emptyOptionsText="Ya no queda equipo pendiente de esta entrega."
                              mobileSheetBreakpoint="md"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-bold text-label-bold text-on-surface">Observaciones</label>
                            <input
                              type="text"
                              value={nuevoDetalleObs}
                              onChange={(e) => setNuevoDetalleObs(e.target.value)}
                              placeholder="Observaciones (opcional)"
                              disabled={guardandoEquipo}
                              className="h-11 w-full rounded-lg border border-outline-variant bg-surface px-3.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={confirmarAgregarEquipo}
                              disabled={guardandoEquipo || !nuevoDetalleId}
                              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
                            >
                              {guardandoEquipo ? (
                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                              ) : (
                                <Check className="h-4 w-4" strokeWidth={2.5} />
                              )}
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={cancelarAgregarEquipo}
                              disabled={guardandoEquipo}
                              className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  </>
                )}
              </SeccionCard>

              {/* Observaciones generales -- editable, único campo que la API
                  permite corregir sobre una devolución ya firmada. */}
              <SeccionCard icon={MessageSquareText} titulo="Observaciones Generales">
                <div className="p-5">
                  <InlineEditableText
                    value={documento.observations || 'Sin observaciones'}
                    onChange={corregirObservacionGeneral}
                    title="Corregir observación"
                    className="font-body-md text-body-md text-on-surface-variant"
                  />
                </div>
              </SeccionCard>

              {/* Firmas */}
              <SeccionCard icon={PenLine} titulo={formato.tituloFirmas}>
                <div className="grid grid-cols-1 gap-stack-lg p-stack-lg sm:grid-cols-2">
                  {formato.firmas.map((firma, indice) => {
                    const url = urlArchivoPublico(
                      indice === 0 ? documento.responsable_signature : documento.administrador_signature,
                    )
                    return (
                      <div key={firma.key} className="flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-3">
                        <div className="mb-2.5 flex items-baseline justify-between gap-3">
                          <p className="font-label-bold text-label-bold text-on-surface">{firma.titulo}</p>
                          {firma.subtitulo && (
                            <p className="shrink-0 font-label-sm text-label-sm text-on-surface-variant">{firma.subtitulo}</p>
                          )}
                        </div>
                        <div className="grid aspect-[5/2] w-full place-items-center rounded-lg border border-outline-variant bg-surface-container-low p-2">
                          <FirmaImagen url={url} alt={`Firma de ${firma.titulo}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </SeccionCard>
            </div>
          )}
        </div>
      </div>

      {!cargando && !error && documento && (
        <div className="sticky bottom-0 z-30 border-t border-outline-variant bg-surface-container-lowest px-container-padding py-3 shadow-sm md:px-8">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleDescargarPdf}
              disabled={generandoPdf}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-6 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60 active:scale-[0.97] transition-transform"
            >
              {generandoPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <Download className="h-4 w-4" strokeWidth={2.25} />
              )}
              Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistorialDevolucionView
