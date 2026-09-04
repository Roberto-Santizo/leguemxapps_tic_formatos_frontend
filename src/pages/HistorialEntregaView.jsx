import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CircleUser, Download, Loader2, Lock, MessageSquareText, PenLine, Rows3, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { SeccionCard, Campo } from './FormatoActa.jsx'
import { FORMATOS } from '../config/formatos.js'
import { obtenerDocumentoEntrega, eliminarDocumentoEntrega, urlArchivoPublico } from '../services/api.js'
import { generatePdfFromElement } from '../utils/generatePdf.js'

const formato = FORMATOS.entrega

function nombrePlanta(location) {
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

const valorClass =
  'flex h-11 items-center rounded-lg border border-outline-variant bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface'

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

  async function handleDescargarPdf() {
    if (!hojaRef.current) return
    setGenerandoPdf(true)
    try {
      await generatePdfFromElement(hojaRef.current, `entrega-equipo-${id}.pdf`)
    } finally {
      setGenerandoPdf(false)
    }
  }

  async function confirmarEliminar() {
    setBorrando(true)
    setErrorBorrar('')
    try {
      await eliminarDocumentoEntrega(token, id)
      navigate('/historial/entrega', { replace: true })
    } catch (err) {
      setErrorBorrar(err.message || 'No se pudo eliminar el documento')
      setBorrando(false)
    }
  }

  return (
    <div className="flex-1 animate-view-in">
      <div ref={hojaRef} className="p-container-padding md:p-8">
        <div className="mx-auto max-w-4xl space-y-stack-lg pb-4">
          <Link
            to="/historial/entrega"
            className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Entrega de Equipo
          </Link>

          {cargando ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-14 justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-outline" strokeWidth={2} />
              <span className="font-body-md text-body-md text-on-surface-variant">Cargando documento...</span>
            </div>
          ) : error ? (
            <p className="font-label-sm text-label-sm text-error rounded-lg border border-error/30 bg-error-container/40 px-3 py-2">
              {error}
            </p>
          ) : (
            <>
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
              <SeccionCard icon={Rows3} titulo={formato.tituloTablaCorta}>
                {!documento.items || documento.items.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 px-5 py-10 text-center">
                    <p className="font-label-bold text-label-bold text-on-surface">Sin equipo registrado</p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left">
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
                            <td className="py-2 pr-3 text-on-surface-variant">{item.is_used || '—'}</td>
                            <td className="py-2 pr-5 text-on-surface-variant break-words">{item.observations || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                          {url ? (
                            <img src={url} alt={`Firma de ${firma.titulo}`} className="max-h-full max-w-full object-contain" />
                          ) : (
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Sin firma</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </SeccionCard>
            </>
          )}
        </div>
      </div>

      {!cargando && !error && (
        <div className="sticky bottom-0 z-30 border-t border-outline-variant bg-surface-container-lowest px-container-padding py-3 shadow-sm md:px-8">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleDescargarPdf}
              disabled={generandoPdf}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-6 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60"
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-error/30 bg-surface-container-lowest px-6 font-label-bold text-label-bold text-error transition-colors hover:bg-error-container"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.25} />
              Eliminar
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={eliminando}
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
    </div>
  )
}

export default HistorialEntregaView
