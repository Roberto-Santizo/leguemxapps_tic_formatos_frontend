import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CircleUser,
  Download,
  Loader2,
  Lock,
  MessageSquareText,
  PenLine,
  PlusCircle,
  Rows3,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import InlineEditableText from '../components/InlineEditableText.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'
import { mostrarToast } from '../components/Toast.jsx'
import { SkeletonDetalle } from '../components/Skeleton.jsx'
import { SeccionCard, Campo } from './FormatoActa.jsx'
import { FORMATOS } from '../config/formatos.js'
import {
  obtenerDocumentoEntrega,
  eliminarDocumentoEntrega,
  urlArchivoPublico,
  listarEquiposDisponibles,
  agregarDetalleEntrega,
  actualizarDetalleEntrega,
  eliminarDetalleEntrega,
} from '../services/api.js'
import { generarPdfPapelFisico } from '../utils/generatePdfPapelFisico.js'
import { construirHtmlEntrega } from '../pdf/plantillaEntrega.js'

const formato = FORMATOS.entrega

function nombrePlanta(location) {
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

const valorClass =
  'flex h-11 items-center rounded-lg border border-outline-variant bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface'

/**
 * Firma guardada en el storage del backend. Si la imagen no carga (ruta
 * distinta, archivo borrado, storage sin publicar) el navegador dibuja su
 * ícono de imagen rota, que en un acta se ve como un error del sistema. Aquí
 * se sustituye por el mismo recuadro de "Sin firma" que ya existe.
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

  return (
    <img
      src={url}
      alt={alt}
      onError={() => setFallo(true)}
      className="max-h-full max-w-full object-contain"
    />
  )
}

/**
 * Detalle de un Documento de Entrega (GET /delivery_documents/{id}) --
 * destino del ojo/tarjeta en HistorialEntregaList. Se pide por id, así que
 * funciona con URL directa o al recargar la página, igual que EquipoView.
 *
 * Se maqueta como el formato físico de la acta (mismo membrete, secciones y
 * clases que FormatoActa.jsx) pero de solo lectura y con los datos reales,
 * porque es justo el contenido que se exporta con el botón PDF.
 */
function HistorialEntregaView() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const hojaRef = useRef(null)

  const [documento, setDocumento] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [eliminando, setEliminando] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [errorBorrar, setErrorBorrar] = useState('')

  const [generandoPdf, setGenerandoPdf] = useState(false)

  // --- Mantenimiento del equipo ya entregado: agregar uno que se quedó
  // fuera, corregir la observación de uno, o quitarlo (delivery_document_details) ---
  const [equipos, setEquipos] = useState([])
  const [agregandoEquipo, setAgregandoEquipo] = useState(false)
  const [nuevoEquipoId, setNuevoEquipoId] = useState('')
  const [nuevoEquipoObs, setNuevoEquipoObs] = useState('')
  const [guardandoEquipo, setGuardandoEquipo] = useState(false)
  const [quitando, setQuitando] = useState(null) // item o null
  const [quitandoEnCurso, setQuitandoEnCurso] = useState(false)
  const [errorQuitar, setErrorQuitar] = useState('')

  function recargar() {
    return obtenerDocumentoEntrega(token, id).then((data) => setDocumento(data))
  }

  useEffect(() => {
    let vivo = true
    setCargando(true)
    setError('')
    obtenerDocumentoEntrega(token, id)
      .then((data) => vivo && setDocumento(data))
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el documento de entrega'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [id, token])

  function abrirAgregarEquipo() {
    setAgregandoEquipo(true)
    if (equipos.length === 0) {
      listarEquiposDisponibles(token)
        .then((data) => setEquipos(Array.isArray(data) ? data : []))
        .catch(() => setEquipos([]))
    }
  }

  function cancelarAgregarEquipo() {
    setAgregandoEquipo(false)
    setNuevoEquipoId('')
    setNuevoEquipoObs('')
  }

  async function confirmarAgregarEquipo() {
    if (!nuevoEquipoId) return
    setGuardandoEquipo(true)
    try {
      await agregarDetalleEntrega(token, {
        delivery_document_id: Number(id),
        equipment_id: Number(nuevoEquipoId),
        observations: nuevoEquipoObs.trim() || undefined,
      })
      await recargar()
      mostrarToast('Equipo agregado a la entrega')
      cancelarAgregarEquipo()
    } catch (err) {
      mostrarToast(err.message || 'No se pudo agregar el equipo', { tipo: 'error' })
    } finally {
      setGuardandoEquipo(false)
    }
  }

  async function corregirObservacion(itemId, observations) {
    try {
      await actualizarDetalleEntrega(token, itemId, { observations })
      setDocumento((doc) => ({
        ...doc,
        items: doc.items.map((it) => (it.id === itemId ? { ...it, observations } : it)),
      }))
      mostrarToast('Observación actualizada')
    } catch (err) {
      mostrarToast(err.message || 'No se pudo corregir la observación', { tipo: 'error' })
    }
  }

  async function confirmarQuitarEquipo() {
    const item = quitando
    setQuitandoEnCurso(true)
    setErrorQuitar('')
    try {
      await eliminarDetalleEntrega(token, item.id)
      setDocumento((doc) => ({ ...doc, items: doc.items.filter((it) => it.id !== item.id) }))
      setQuitando(null)
      mostrarToast('Equipo quitado de la entrega')
    } catch (err) {
      setErrorQuitar(err.message || 'No se pudo quitar el equipo')
    } finally {
      setQuitandoEnCurso(false)
    }
  }

  async function handleDescargarPdf() {
    if (!documento) return
    setGenerandoPdf(true)
    try {
      const html = construirHtmlEntrega(documento, formato, {
        responsable: urlArchivoPublico(documento.responsable_signature),
        it: urlArchivoPublico(documento.administrador_signature),
      })
      await generarPdfPapelFisico(html, `entrega-equipo-${id}.pdf`)
    } catch {
      // Antes fallaba en silencio: el usuario veía la rueda girar y detenerse
      // sin PDF y sin explicación.
      mostrarToast('No se pudo generar el PDF', { tipo: 'error' })
    } finally {
      setGenerandoPdf(false)
    }
  }

  async function confirmarEliminar() {
    setBorrando(true)
    setErrorBorrar('')
    try {
      await eliminarDocumentoEntrega(token, id)
      mostrarToast('Entrega eliminada')
      navigate('/historial/entrega', { replace: true })
    } catch (err) {
      setErrorBorrar(err.message || 'No se pudo eliminar el documento')
      setBorrando(false)
    }
  }

  return (
    <div className="flex-1 animate-view-in">
      {/* El ref del PDF NO envuelve el botón "volver": antes la captura lo
          incluía y el acta descargada salía con una flecha de navegación
          impresa. Ahora arranca en el membrete. */}
      <div className="p-container-padding md:p-8">
        <div className="mx-auto max-w-4xl space-y-stack-lg pb-4">
          <Link
            to="/historial/entrega"
            className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Entrega de Equipo
          </Link>

          {cargando ? (
            <SkeletonDetalle secciones={3} camposPorSeccion={3} />
          ) : error || !documento ? (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
              <EstadoVacio
                variante="error"
                titulo={error ? 'No se pudo cargar el documento' : 'Documento no encontrado'}
                descripcion={
                  error || 'Es posible que esta entrega ya se haya eliminado desde otra sesión.'
                }
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
            <div ref={hojaRef} className="space-y-stack-lg">
              {/* Membrete -- mismo bloque que FormatoActa.jsx */}
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
                  <Campo label="Fecha de Entrega">
                    <div className={valorClass}>{documento.delivery_date || '—'}</div>
                  </Campo>
                  <Campo label="Responsable que Recibe" span="col-span-12 sm:col-span-8">
                    <div className={valorClass}>{documento.employee_name || '—'}</div>
                  </Campo>
                  <Campo label="Departamento">
                    <div className={valorClass}>{documento.employee_department || '—'}</div>
                  </Campo>
                  <Campo label="Planta">
                    <div className={valorClass}>{nombrePlanta(documento.location)}</div>
                  </Campo>
                </div>
              </SeccionCard>

              {/* Tabla de equipo */}
              <SeccionCard
                icon={Rows3}
                titulo={formato.tituloTablaCorta}
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
                    <table className="w-full min-w-[760px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-outline-variant bg-surface-container-low">
                          <th className="w-14 py-2.5 pl-5 pr-3 text-right font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
                            No.
                          </th>
                          {['Equipo', 'Marca', 'Modelo', 'No. Serie', 'Estado', 'Observaciones'].map((col) => (
                            <th
                              key={col}
                              className="py-2.5 pr-3 font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant"
                            >
                              {col}
                            </th>
                          ))}
                          <th className="w-12 py-2.5 pr-5" />
                        </tr>
                      </thead>
                      <tbody>
                        {documento.items.map((item, indice) => (
                          <tr key={item.id} className="border-b border-outline-variant">
                            <td className="py-2 pl-5 pr-3 text-right font-mono text-body-md tabular-nums text-on-surface-variant">
                              {String(indice + 1).padStart(2, '0')}
                            </td>
                            <td className="py-2 pr-3 font-medium text-on-surface break-words">
                              <div className="flex items-center gap-2">
                                <span>{item.equipment_name || '—'}</span>
                                {item.returned && (
                                  <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                                    Devuelto
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 pr-3 text-on-surface-variant break-words">{item.equipment_brand || '—'}</td>
                            <td className="py-2 pr-3 text-on-surface-variant break-words">{item.equipment_model || '—'}</td>
                            <td className="py-2 pr-3 font-mono uppercase text-on-surface-variant">
                              {item.equipment_serie || '—'}
                            </td>
                            <td className="py-2 pr-3 text-on-surface-variant">{item.is_used || '—'}</td>
                            <td className="py-2 pr-3 text-on-surface-variant break-words">
                              {item.returned ? (
                                item.observations || '—'
                              ) : (
                                <InlineEditableText
                                  value={item.observations || 'Sin observaciones'}
                                  onChange={(valor) => corregirObservacion(item.id, valor)}
                                  title="Corregir observación"
                                />
                              )}
                            </td>
                            <td className="py-2 pr-5">
                              {!item.returned && (
                                <button
                                  type="button"
                                  onClick={() => setQuitando(item)}
                                  aria-label="Quitar equipo de la entrega"
                                  title="Quitar (se agregó por error)"
                                  className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container active:scale-[0.97] transition-transform"
                                >
                                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}

                        {agregandoEquipo && (
                          <tr className="border-b border-outline-variant bg-surface-container-low/40">
                            <td className="py-2 pl-5 pr-3" />
                            <td className="py-2 pr-3" colSpan={4}>
                              <SearchableSelect
                                options={equipos.map((e) => ({ id: e.id, name: e.brand ? `${e.name} — ${e.brand}` : e.name }))}
                                value={nuevoEquipoId}
                                onChange={setNuevoEquipoId}
                                disabled={guardandoEquipo}
                                placeholder="Selecciona el equipo a agregar"
                                emptyOptionsText="No hay equipos registrados en el catálogo todavía."
                              />
                            </td>
                            <td className="py-2 pr-3" colSpan={2}>
                              <input
                                type="text"
                                value={nuevoEquipoObs}
                                onChange={(e) => setNuevoEquipoObs(e.target.value)}
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
                                  disabled={guardandoEquipo || !nuevoEquipoId}
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

                  {/* Móvil: una tarjeta por artículo, mismo patrón que la
                      tabla de equipo al crear una Entrega (FormatoActa.jsx). */}
                  <div className="flex flex-col gap-stack-sm p-4 md:hidden">
                    {documento.items.map((item, indice) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
                      >
                        <div className="mb-stack-sm flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0 font-mono text-body-md tabular-nums text-on-surface-variant">
                              {String(indice + 1).padStart(2, '0')}
                            </span>
                            <span className="font-label-bold text-label-bold text-on-surface break-words">
                              {item.equipment_name || '—'}
                            </span>
                            {item.returned && (
                              <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                                Devuelto
                              </span>
                            )}
                          </div>
                          {!item.returned && (
                            <button
                              type="button"
                              onClick={() => setQuitando(item)}
                              aria-label="Quitar equipo de la entrega"
                              title="Quitar (se agregó por error)"
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container active:scale-[0.97] transition-transform"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={2} />
                            </button>
                          )}
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
                          <div>
                            <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                              No. Serie
                            </p>
                            <p className="font-mono text-body-md uppercase text-on-surface">
                              {item.equipment_serie || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                              Estado
                            </p>
                            <p className="font-body-md text-body-md text-on-surface">{item.is_used || '—'}</p>
                          </div>
                        </div>

                        <div className="mt-stack-sm">
                          <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                            Observaciones
                          </p>
                          {item.returned ? (
                            <p className="font-body-md text-body-md text-on-surface break-words">
                              {item.observations || '—'}
                            </p>
                          ) : (
                            <InlineEditableText
                              value={item.observations || 'Sin observaciones'}
                              onChange={(valor) => corregirObservacion(item.id, valor)}
                              title="Corregir observación"
                            />
                          )}
                        </div>
                      </div>
                    ))}

                    {agregandoEquipo && (
                      <div className="rounded-xl border border-dashed border-outline bg-surface-container-low/40 p-4">
                        <div className="flex flex-col gap-stack-sm">
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-bold text-label-bold text-on-surface">Equipo</label>
                            <SearchableSelect
                              options={equipos.map((e) => ({ id: e.id, name: e.brand ? `${e.name} — ${e.brand}` : e.name }))}
                              value={nuevoEquipoId}
                              onChange={setNuevoEquipoId}
                              disabled={guardandoEquipo}
                              placeholder="Selecciona el equipo a agregar"
                              emptyOptionsText="No hay equipos registrados en el catálogo todavía."
                              mobileSheetBreakpoint="md"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-bold text-label-bold text-on-surface">Observaciones</label>
                            <input
                              type="text"
                              value={nuevoEquipoObs}
                              onChange={(e) => setNuevoEquipoObs(e.target.value)}
                              placeholder="Observaciones (opcional)"
                              disabled={guardandoEquipo}
                              className="h-11 w-full rounded-lg border border-outline-variant bg-surface px-3.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={confirmarAgregarEquipo}
                              disabled={guardandoEquipo || !nuevoEquipoId}
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

              {/* Cláusula de responsabilidad -- mismo texto fijo del formato */}
              {formato.clausulas.length > 0 && (
                <SeccionCard icon={Lock} titulo={formato.tituloClausula} nota="Texto fijo del formato">
                  <div className="space-y-3 p-5">
                    {formato.clausulas.map((texto) => (
                      <p
                        key={texto.slice(0, 40)}
                        className="border-l-2 border-outline-variant pl-4 font-body-md text-body-md leading-relaxed text-pretty text-on-surface"
                      >
                        {texto}
                      </p>
                    ))}
                  </div>
                </SeccionCard>
              )}

              {/* Observaciones generales */}
              <SeccionCard icon={MessageSquareText} titulo="Observaciones Generales">
                <div className="p-5">
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {documento.observations || 'Sin observaciones.'}
                  </p>
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
            {documento.items?.some((it) => !it.returned) && (
              <button
                type="button"
                onClick={() => navigate(`/historial/entrega/${id}/devolucion`)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-6 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
              >
                <Undo2 className="h-4 w-4" strokeWidth={2.25} />
                Registrar devolución
              </button>
            )}
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
            <button
              type="button"
              onClick={() => setEliminando(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-error/30 bg-surface-container-lowest px-6 font-label-bold text-label-bold text-error transition-colors hover:bg-error-container active:scale-[0.97] transition-transform"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.25} />
              Eliminar
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={eliminando}
        variante="peligro"
        titulo="Eliminar documento de entrega"
        mensaje={`¿Desea eliminar esta entrega? Esta acción no se puede deshacer.${errorBorrar ? ` ${errorBorrar}` : ''}`}
        textoConfirmar={borrando ? 'Eliminando...' : 'Sí, eliminar'}
        onCancelar={() => {
          if (borrando) return
          setEliminando(false)
          setErrorBorrar('')
        }}
        onConfirmar={confirmarEliminar}
      />

      <ConfirmDialog
        abierto={Boolean(quitando)}
        variante="peligro"
        titulo="Quitar equipo de la entrega"
        mensaje={
          quitando
            ? `¿Desea quitar "${quitando.equipment_name}" de esta entrega? Esta acción no se puede deshacer.${
                errorQuitar ? ` ${errorQuitar}` : ''
              }`
            : ''
        }
        textoConfirmar={quitandoEnCurso ? 'Quitando...' : 'Sí, quitar'}
        onCancelar={() => {
          if (quitandoEnCurso) return
          setQuitando(null)
          setErrorQuitar('')
        }}
        onConfirmar={confirmarQuitarEquipo}
      />
    </div>
  )
}

export default HistorialEntregaView
