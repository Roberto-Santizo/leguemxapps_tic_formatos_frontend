import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Buscador from '../components/Buscador.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import { SkeletonTabla, SkeletonTarjetas } from '../components/Skeleton.jsx'
import { FORMATOS } from '../config/formatos.js'
import { listarDocumentosDevolucion } from '../services/api.js'

function nombreEstado(status) {
  if (status === 'devuelto') return 'Devuelto'
  if (status === 'parcial') return 'Parcial'
  if (status === 'pendiente') return 'Pendiente'
  return '—'
}

/**
 * Lista de Documentos de Devolución (GET /return_documents). Mismo patrón
 * que HistorialEntregaList.jsx: escritorio con tabla + ojo (ver), móvil con
 * tarjetas sin botones que llevan directo al detalle. Sin eliminar -- la API
 * no ofrece DELETE para return_documents.
 */
function HistorialDevolucionList() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      const data = await listarDocumentosDevolucion(token)
      setDocumentos(Array.isArray(data) ? data : [])
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo obtener la lista de devoluciones')
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => {
    cargar()
  }, [cargar])

  const visibles = useMemo(() => {
    const filtro = busqueda.trim().toLowerCase()
    if (!filtro) return documentos
    return documentos.filter(
      (d) =>
        (d.employee_name || '').toLowerCase().includes(filtro) ||
        (d.employee_department || '').toLowerCase().includes(filtro),
    )
  }, [documentos, busqueda])

  const hayRegistros = visibles.length > 0
  const sinContenido = !cargando && (Boolean(errorCarga) || !hayRegistros)

  const botonSecundario =
    'inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform'

  const estado = errorCarga ? (
    <EstadoVacio
      variante="error"
      titulo="No se pudo cargar el historial"
      descripcion={errorCarga}
      accion={
        <button type="button" onClick={cargar} className={botonSecundario}>
          Reintentar
        </button>
      }
    />
  ) : busqueda ? (
    <EstadoVacio
      variante="busqueda"
      titulo="No se encontraron resultados"
      descripcion={`Ninguna coincidencia para “${busqueda}”.`}
      accion={
        <button type="button" onClick={() => setBusqueda('')} className={botonSecundario}>
          Limpiar búsqueda
        </button>
      }
    />
  ) : (
    <EstadoVacio
      icon={FORMATOS.devolucion.icon}
      titulo="Todavía no hay devoluciones registradas"
      descripcion="Busca al responsable que está devolviendo equipo para registrar la primera."
      accion={
        <Link to="/historial/devolucion/nueva" className={botonSecundario}>
          Registrar devolución
        </Link>
      }
    />
  )

  const iconoActivo =
    'inline-grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface active:scale-[0.97] transition-transform'

  function verDocumento(documento) {
    navigate(`/historial/devolucion/${documento.id}`)
  }

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <Link
          to="/historial"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Historial de Actas
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">
              Devolución de Equipo
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Devoluciones registradas, parciales o completas, con la entrega de la que provienen.
            </p>
          </div>
          <Link
            to="/historial/devolucion/nueva"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2} />
            Registrar devolución
          </Link>
        </div>

        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por colaborador o departamento..." />

        {/* ---- Escritorio y tablet: tabla, ojo (ver) ---- */}
        <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {cargando ? (
            <SkeletonTabla columnas={5} filas={5} />
          ) : sinContenido ? (
            estado
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Fecha
                  </th>
                  <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Colaborador
                  </th>
                  <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Departamento
                  </th>
                  <th className="w-28 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Entrega
                  </th>
                  <th className="w-32 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Estado
                  </th>
                  <th className="w-16 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap text-right">
                    Ver
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-on-surface divide-y divide-outline-variant">
                {visibles.map((documento) => (
                  <tr key={documento.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4 text-on-surface-variant whitespace-nowrap">
                      {documento.return_date || '—'}
                    </td>
                    <td className="px-5 py-4 font-medium text-on-surface break-words">
                      {documento.employee_name || '—'}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant break-words">
                      {documento.employee_department || '—'}
                    </td>
                    <td className="px-5 py-4 font-mono text-on-surface-variant tabular-nums">
                      #{documento.delivery_document_id}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant">
                        {nombreEstado(documento.delivery_document_status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => verDocumento(documento)}
                        aria-label={`Ver devolución de ${documento.employee_name}`}
                        title="Ver"
                        className={iconoActivo}
                      >
                        <Eye className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ---- Móvil: tarjetas apiladas, sin botones -- toda la tarjeta lleva al detalle ---- */}
        <div className="md:hidden flex flex-col gap-stack-sm">
          {cargando ? (
            <SkeletonTarjetas filas={4} />
          ) : sinContenido ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">{estado}</div>
          ) : (
            visibles.map((documento) => (
              <button
                key={documento.id}
                type="button"
                onClick={() => verDocumento(documento)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3.5 text-left shadow-sm transition-all hover:bg-surface-container-low active:scale-[0.99] active:bg-surface-container-low"
              >
                <div className="min-w-0">
                  <p className="font-body-md text-body-md font-medium text-on-surface break-words">
                    {documento.employee_name || '—'}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant break-words">
                    {documento.employee_department || '—'} · Entrega #{documento.delivery_document_id}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant">
                  {nombreEstado(documento.delivery_document_status)}
                </span>
              </button>
            ))
          )}
        </div>

        {!cargando && !sinContenido && (
          <p className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">
            {visibles.length === documentos.length
              ? `${documentos.length} devoluciones`
              : `${visibles.length} de ${documentos.length} devoluciones`}
          </p>
        )}
      </div>
    </div>
  )
}

export default HistorialDevolucionList
