import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CircleUser,
  Download,
  Eye,
  ExternalLink,
  Lock,
  MessageSquareText,
  PenLine,
  PlusCircle,
  Rows3,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import InlineEditableText from '../components/InlineEditableText.jsx'
import EditorFechaLocal from '../components/EditorFechaLocal.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'
import EquipoDetalleModal from '../components/EquipoDetalleModal.jsx'
import useFichaEquipo from '../hooks/useFichaEquipo.js'
import { IndicadorGuardando, mostrarToast } from '../components/Toast.jsx'
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
import { constanciaDevolucion } from '../utils/fecha.js'
import useFechaLocal from '../hooks/useFechaLocal.js'
import { esExtravio, textoSinPrefijoExtravio, marcarExtravio } from '../utils/extravio.js'
import { construirHtmlDevolucion } from '../pdf/plantillaDevolucion.js'
import { caracteristicasDeRenglones, firmaParaPdf } from '../pdf/datosPdf.js'
import IsotipoCarga from '../components/IsotipoCarga.jsx'
import EsperaLogo from '../components/EsperaLogo.jsx'
const formato = FORMATOS.devolucion

function nombrePlanta(location) {
  if (location === 'Planta Tejar' || location === 'Planta Parramos') return location
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

const valorClass =
  'flex h-11 items-center rounded-lg border border-outline-variant bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface'

// Ojo de un renglón de equipo: abre su ficha (características y, para
// admin, "Editar"), igual que el ojo del selector al armar el acta. Mientras
// se busca el equipo en el catálogo (el renglón no trae su id) muestra el
// isotipo en lugar del ojo.
function BotonFicha({ item, ficha }) {
  const buscando = ficha.buscandoItem === item.id
  return (
    <button
      type="button"
      onClick={() => ficha.abrirDeItem(item)}
      disabled={ficha.buscandoItem !== null}
      aria-busy={buscando}
      aria-label={`Ver ficha de ${item.equipment_name || 'equipo'}`}
      title="Ver ficha del equipo"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-wait active:scale-[0.90] transition-transform"
    >
      {buscando ? <IsotipoCarga tono="tinta" className="h-2.5" /> : <Eye className="h-4 w-4" strokeWidth={2} />}
    </button>
  )
}

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
  const { token, isAdmin } = useAuth()
  const hojaRef = useRef(null)

  const [documento, setDocumento] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [generandoPdf, setGenerandoPdf] = useState(false)

  // Corrección local (solo este navegador) de la fecha de devolución -- ver
  // useFechaLocal.js.
  const fechaDevolucion = useFechaLocal('devolucion', id, documento?.return_date)

  // --- Completar una devolución ya firmada: agregar un equipo pendiente de
  // la misma entrega que se quedó fuera (POST /return_document_details) ---
  const [agregandoEquipo, setAgregandoEquipo] = useState(false)
  // Ficha del equipo (ojo de cada renglón y del selector de "Agregar
  // equipo"): ver sus características y corregir sus datos sin salir de la
  // devolución.
  const ficha = useFichaEquipo(token)
  const [pendientes, setPendientes] = useState([])
  const [nuevoDetalleId, setNuevoDetalleId] = useState('')
  const [nuevoDetalleObs, setNuevoDetalleObs] = useState('')
  const [guardandoEquipo, setGuardandoEquipo] = useState(false)
  // Solo presentación: cuántas correcciones de observación siguen en curso
  // (para la pastilla de "guardando"); no cambia qué se envía.
  const [corrigiendo, setCorrigiendo] = useState(0)

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

  // Opciones del equipo pendiente con la serie en `codigo` (visible y
  // buscable ignorando espacios y guiones), igual que la hoja de entrega.
  const opcionesPendientes = pendientes
    .map((it) => ({
      id: it.id,
      name: it.equipment_brand ? `${it.equipment_name} — ${it.equipment_brand}` : it.equipment_name,
      codigo: it.equipment_serie ? String(it.equipment_serie).toUpperCase() : '',
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'es') || a.codigo.localeCompare(b.codigo, 'es'))

  // El ojo solo se ofrece si el detalle trae el id del equipo (la opción es el
  // detalle de la entrega, no el equipo).
  const verDetallePendiente = pendientes.some((it) => it.equipment_id)
    ? (detalleId) => {
        const it = pendientes.find((p) => String(p.id) === String(detalleId))
        if (it?.equipment_id) ficha.setEquipoId(String(it.equipment_id))
      }
    : undefined

  function refrescarTrasEditarEquipo() {
    ficha.olvidarCatalogo()
    recargar().catch(() => {})
    if (documento?.delivery_document_id) {
      listarDetallesEntrega(token, { deliveryDocumentId: documento.delivery_document_id, pending: true })
        .then((data) => setPendientes(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
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

  // Vacío = "sin observaciones": se manda null en vez de un texto en blanco
  // (el campo es nullable en la API). En un extravío nunca llega vacío:
  // marcarExtravio() siempre deja el prefijo y un texto por defecto.
  async function corregirObservacionGeneral(texto) {
    const observations = texto || null
    setCorrigiendo((n) => n + 1)
    try {
      await actualizarDocumentoDevolucion(token, id, { observations })
      setDocumento((doc) => ({ ...doc, observations }))
      mostrarToast('Observación actualizada')
    } catch (err) {
      mostrarToast(err.message || 'No se pudo corregir la observación', { tipo: 'error' })
    } finally {
      setCorrigiendo((n) => n - 1)
    }
  }

  async function corregirObservacionItem(itemId, texto) {
    const observations = texto || null
    setCorrigiendo((n) => n + 1)
    try {
      await actualizarDetalleDevolucion(token, itemId, { observations })
      setDocumento((doc) => ({
        ...doc,
        items: doc.items.map((it) => (it.id === itemId ? { ...it, observations } : it)),
      }))
      mostrarToast('Observación actualizada')
    } catch (err) {
      mostrarToast(err.message || 'No se pudo corregir la observación', { tipo: 'error' })
    } finally {
      setCorrigiendo((n) => n - 1)
    }
  }

  async function handleDescargarPdf() {
    if (!documento) return
    setGenerandoPdf(true)
    try {
      // Las mismas firmas que se ven en pantalla, incrustadas en el PDF (ver
      // firmaParaPdf), y las características de cada equipo bajo su nombre.
      const [entrega, recibe, caract] = await Promise.all([
        firmaParaPdf(documento.responsable_signature),
        firmaParaPdf(documento.administrador_signature),
        caracteristicasDeRenglones(token, documento.items),
      ])
      const html = construirHtmlDevolucion(
        { ...documento, return_date: fechaDevolucion.valor },
        formato,
        { entrega, recibe },
        caract,
      )
      await generarPdfPapelFisico(html, `devolucion-equipo-${id}.pdf`)
      // Hay firma guardada pero no se pudo traer (ver firmaParaPdf): el PDF
      // sale igual, con "Sin firma", pero se avisa en vez de callarlo.
      if ((documento.responsable_signature && !entrega) || (documento.administrador_signature && !recibe)) {
        mostrarToast('No se pudieron incluir las firmas en el PDF', { tipo: 'error' })
      }
    } catch {
      mostrarToast('No se pudo generar el PDF', { tipo: 'error' })
    } finally {
      setGenerandoPdf(false)
    }
  }

  return (
    <div className="flex-1 [&+footer]:pb-[calc(88px+env(safe-area-inset-bottom))] md:[&+footer]:pb-[88px]">
      <div className="px-4 pt-6 pb-10 md:px-8 md:pt-10">
        <div className="mx-auto max-w-4xl animate-view-in space-y-stack-lg">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-5">
            <Link
              to="/historial/devolucion"
              className="inline-flex h-9 items-center gap-2 rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              Devolución de Equipo
            </Link>
            <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
              <span aria-hidden="true" className="h-px w-7 bg-outline" />
              Historial / Devolución / Detalle
            </div>
          </div>

          {cargando ? (
            <SkeletonDetalle secciones={3} camposPorSeccion={3} />
          ) : error || !documento ? (
            <div className="rounded-tarjeta bg-white shadow-tarjeta">
              <EstadoVacio
                variante="error"
                titulo={error ? 'No se pudo cargar el documento' : 'Documento no encontrado'}
                descripcion={error || 'Es posible que esta devolución ya no exista.'}
                accion={
                  <Link
                    to="/historial/devolucion"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
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
                    <div className={valorClass}>
                      <EditorFechaLocal
                        value={fechaDevolucion.valor}
                        corregida={fechaDevolucion.corregida}
                        onChange={fechaDevolucion.corregir}
                        onRestablecer={fechaDevolucion.restablecer}
                        title="Clic para corregir la fecha de devolución (solo en este navegador)"
                      />
                    </div>
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
                      className="flex h-11 items-center justify-between gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
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
                  isAdmin ? (
                    <button
                      type="button"
                      onClick={abrirAgregarEquipo}
                      disabled={agregandoEquipo}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50 active:scale-[0.90] transition-transform"
                    >
                      <PlusCircle className="h-4 w-4" strokeWidth={2} />
                      Agregar equipo
                    </button>
                  ) : undefined
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
                          {isAdmin && <th className="w-12 py-2.5 pr-5" />}
                        </tr>
                      </thead>
                      <tbody>
                        {documento.items.map((item, indice) => {
                          const extravio = esExtravio(item.observations)
                          return (
                          <tr key={item.id} className={`border-b border-outline-variant ${extravio ? 'bg-error-container/30' : ''}`}>
                            <td className="py-2 pl-5 pr-3 text-right font-mono text-body-md tabular-nums text-on-surface-variant">
                              {String(indice + 1).padStart(2, '0')}
                            </td>
                            <td className="py-2 pr-3 font-medium text-on-surface break-words">
                              {item.equipment_name || '—'}
                              {extravio && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-error px-2 py-0.5 font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-error">
                                  Extravío
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-3 text-on-surface-variant break-words">{item.equipment_brand || '—'}</td>
                            <td className="py-2 pr-3 text-on-surface-variant break-words">{item.equipment_model || '—'}</td>
                            <td className="py-2 pr-3 font-mono uppercase text-on-surface-variant">
                              {item.equipment_serie || '—'}
                            </td>
                            <td className={`py-2 ${isAdmin ? 'pr-3' : 'pr-5'} text-on-surface-variant break-words`}>
                              {isAdmin ? (
                                <InlineEditableText
                                  value={extravio ? textoSinPrefijoExtravio(item.observations) : item.observations || ''} placeholder="Sin observaciones" permitirVacio
                                  onChange={(valor) => corregirObservacionItem(item.id, extravio ? marcarExtravio(valor) : valor)}
                                  title="Corregir observación"
                                />
                              ) : (
                                (extravio ? textoSinPrefijoExtravio(item.observations) : item.observations) || 'Sin observaciones'
                              )}
                            </td>
                            {isAdmin && (
                              <td className="py-2 pr-5">
                                <BotonFicha item={item} ficha={ficha} />
                              </td>
                            )}
                          </tr>
                          )
                        })}

                        {agregandoEquipo && (
                          <tr className="border-b border-outline-variant bg-surface-container-low/40">
                            <td className="py-2 pl-5 pr-3" />
                            {/* Solo admin agrega equipo, y para admin la tabla
                                tiene 7 columnas (No., Equipo, Marca, Modelo,
                                No. Serie, Observaciones y la del ojo):
                                1 + 2 + 3 + 1. Si no suman lo mismo que el
                                encabezado, la tabla gana una columna fantasma
                                y se desalinea. */}
                            <td className="py-2 pr-3" colSpan={2}>
                              <SearchableSelect
                                options={opcionesPendientes}
                                onVerDetalle={verDetallePendiente}
                                value={nuevoDetalleId}
                                onChange={setNuevoDetalleId}
                                disabled={guardandoEquipo}
                                placeholder="Selecciona el equipo pendiente"
                                emptyOptionsText="Ya no queda equipo pendiente de esta entrega."
                              />
                            </td>
                            <td className="py-2 pr-3" colSpan={3}>
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
                                  className="grid h-8 w-8 place-items-center rounded-lg text-primary transition-colors hover:bg-primary/10 disabled:opacity-40 active:scale-[0.90] transition-transform"
                                >
                                  {guardandoEquipo ? (
                                    <IsotipoCarga tono="tinta" className="h-2.5" />
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
                                  className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high active:scale-[0.90] transition-transform"
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
                    {documento.items.map((item, indice) => {
                      const extravio = esExtravio(item.observations)
                      return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-4 ${
                          extravio ? 'border-error bg-error-container/30' : 'border-outline-variant bg-surface-container-lowest'
                        }`}
                      >
                        <div className="mb-stack-sm flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="shrink-0 font-mono text-body-md tabular-nums text-on-surface-variant">
                              {String(indice + 1).padStart(2, '0')}
                            </span>
                            <span className="font-label-bold text-label-bold text-on-surface break-words">
                              {item.equipment_name || '—'}
                            </span>
                            {extravio && (
                              <span className="inline-flex items-center rounded-full bg-error px-2 py-0.5 font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-error">
                                Extravío
                              </span>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="-my-1 shrink-0">
                              <BotonFicha item={item} ficha={ficha} />
                            </div>
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
                          {isAdmin ? (
                            <InlineEditableText
                              value={extravio ? textoSinPrefijoExtravio(item.observations) : item.observations || ''} placeholder="Sin observaciones" permitirVacio
                              onChange={(valor) => corregirObservacionItem(item.id, extravio ? marcarExtravio(valor) : valor)}
                              title="Corregir observación"
                            />
                          ) : (
                            <p className="font-body-md text-body-md text-on-surface break-words">
                              {(extravio ? textoSinPrefijoExtravio(item.observations) : item.observations) || 'Sin observaciones'}
                            </p>
                          )}
                        </div>
                      </div>
                      )
                    })}

                    {agregandoEquipo && (
                      <div className="rounded-xl border border-dashed border-outline bg-surface-container-low/40 p-4">
                        <div className="flex flex-col gap-stack-sm">
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-bold text-label-bold text-on-surface">Equipo</label>
                            <SearchableSelect
                              options={opcionesPendientes}
                              onVerDetalle={verDetallePendiente}
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
                                <IsotipoCarga className="h-3" />
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

              {/* Constancia de devolución -- mismo texto de la hoja física,
                  con el día/mes/año ya resueltos de return_date en vez de
                  dejarlos en blanco (ver constanciaDevolucion en utils/fecha.js). */}
              <SeccionCard icon={Lock} titulo={formato.tituloClausula} nota="Texto fijo del formato">
                <div className="p-5">
                  <p className="border-l-2 border-outline-variant pl-4 font-body-md text-body-md leading-relaxed text-pretty text-on-surface">
                    {constanciaDevolucion(fechaDevolucion.valor)}
                  </p>
                </div>
              </SeccionCard>

              {/* Observaciones generales -- editable, único campo que la API
                  permite corregir sobre una devolución ya firmada. */}
              <SeccionCard icon={MessageSquareText} titulo="Observaciones Generales">
                <div className="p-5">
                  {isAdmin ? (
                    <InlineEditableText
                      value={documento.observations || ''} placeholder="Sin observaciones" permitirVacio
                      onChange={corregirObservacionGeneral}
                      title="Corregir observación"
                      className="font-body-md text-body-md text-on-surface-variant"
                    />
                  ) : (
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {documento.observations || 'Sin observaciones'}
                    </p>
                  )}
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
        <div data-barra-inferior className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:left-drawer-width md:overflow-hidden md:px-8 md:pb-3 md:[scrollbar-gutter:stable]">
          <div className="[&>*]:pointer-events-auto mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleDescargarPdf}
              disabled={generandoPdf}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-toast transition duration-fast ease-standard hover:bg-tinta-hover disabled:opacity-50 active:scale-[0.97]"
            >
              {generandoPdf ? (
                <IsotipoCarga className="h-3" />
              ) : (
                <Download className="h-4 w-4" strokeWidth={1.75} />
              )}
              Descargar PDF
            </button>
          </div>
        </div>
      )}

      <EquipoDetalleModal
        equipoId={ficha.equipoId}
        onCerrar={ficha.cerrar}
        editable
        onActualizado={refrescarTrasEditarEquipo}
      />
      <EsperaLogo activa={generandoPdf} mensaje="Generando PDF…" />
      <IndicadorGuardando activo={guardandoEquipo || corrigiendo > 0} />
    </div>
  )
}

export default HistorialDevolucionView
