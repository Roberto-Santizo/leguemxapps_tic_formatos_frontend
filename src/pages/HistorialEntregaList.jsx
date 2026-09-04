import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Buscador from '../components/Buscador.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { listarDocumentosEntrega, eliminarDocumentoEntrega } from '../services/api.js'

function nombrePlanta(location) {
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

/**
 * Lista de Documentos de Entrega (GET /delivery_documents). Mismo flujo que
 * el resto del catálogo: escritorio con ojo (ver) + basura (eliminar, con
 * confirmación); móvil con tarjetas sin botones que llevan directo al
 * detalle, donde también está la opción de eliminar.
 */
function HistorialEntregaList() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [eliminando, setEliminando] = useState(null) // documento o null
  const [borrando, setBorrando] = useState(false)
  const [errorBorrar, setErrorBorrar] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      const data = await listarDocumentosEntrega(token)
      setDocumentos(Array.isArray(data) ? data : [])
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo obtener la lista de entregas')
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
        (d.employee_department || '').toLowerCase().includes(filtro) ||
        nombrePlanta(d.location).toLowerCase().includes(filtro),
    )
  }, [documentos, busqueda])

  async function confirmarEliminar() {
    const documento = eliminando
    setBorrando(true)
    setErrorBorrar('')
    try {
      await eliminarDocumentoEntrega(token, documento.id)
      setDocumentos((lista) => lista.filter((d) => d.id !== documento.id))
      setEliminando(null)
    } catch (err) {
      setErrorBorrar(err.message || 'No se pudo eliminar el documento')
    } finally {
      setBorrando(false)
    }
  }

  const hayRegistros = visibles.length > 0
  const mostrarEstado = cargando || errorCarga || !hayRegistros

  const estado = cargando ? (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-outline" strokeWidth={2} />
      <p className="font-body-md text-body-md text-on-surface-variant">Cargando entregas...</p>
    </div>
  ) : errorCarga ? (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <p className="font-label-bold text-label-bold text-on-surface">No se pudo cargar el historial</p>
      <p className="font-body-md text-body-md text-on-surface-variant">{errorCarga}</p>
      <button
        type="button"
        onClick={cargar}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
      >
        Reintentar
      </button>
    </div>
  ) : busqueda ? (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <p className="font-label-bold text-label-bold text-on-surface">No se encontraron resultados</p>
      <p className="font-body-md text-body-md text-on-surface-variant break-words">
        Ninguna coincidencia para “{busqueda}”.
      </p>
      <button
        type="button"
        onClick={() => setBusqueda('')}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
      >
        Limpiar búsqueda
      </button>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-1.5 px-5 py-14 text-center">
      <p className="font-label-bold text-label-bold text-on-surface">Todavía no hay entregas registradas</p>
      <p className="font-body-md text-body-md text-on-surface-variant">
        Registra una desde "Nueva Acta" → "Entrega de Equipo".
      </p>
    </div>
  )

  const iconoActivo =
    'inline-grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface'

  function verDocumento(documento) {
    navigate(`/historial/entrega/${documento.id}`)
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

        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">
            Entrega de Equipo
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Documentos de entrega registrados, con el equipo incluido en cada uno.
          </p>
        </div>

        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por colaborador, departamento o planta..." />

        {/* ---- Escritorio y tablet: tabla, ojo (ver) + basura (eliminar con confirmación) ---- */}
        <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {mostrarEstado ? (
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
                  <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Planta
                  </th>
                  <th className="w-28 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Equipos
                  </th>
                  <th className="w-28 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-on-surface divide-y divide-outline-variant">
                {visibles.map((documento) => (
                  <tr key={documento.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4 text-on-surface-variant whitespace-nowrap">
                      {documento.delivery_date || '—'}
                    </td>
                    <td className="px-5 py-4 font-medium text-on-surface break-words">
                      {documento.employee_name || '—'}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant break-words">
                      {documento.employee_department || '—'}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant whitespace-nowrap">
                      {nombrePlanta(documento.location)}
                    </td>
                    <td className="px-5 py-4 font-mono text-on-surface-variant tabular-nums">
                      {Array.isArray(documento.items) ? documento.items.length : 0}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => verDocumento(documento)}
                          aria-label={`Ver entrega de ${documento.employee_name}`}
                          title="Ver"
                          className={iconoActivo}
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEliminando(documento)}
                          aria-label={`Eliminar entrega de ${documento.employee_name}`}
                          title="Eliminar"
                          className={iconoActivo}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ---- Móvil: tarjetas apiladas, sin botones -- toda la tarjeta lleva al detalle ---- */}
        <div className="md:hidden flex flex-col gap-stack-sm">
          {mostrarEstado ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">{estado}</div>
          ) : (
            visibles.map((documento) => (
              <button
                key={documento.id}
                type="button"
                onClick={() => verDocumento(documento)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-surface-container-low"
              >
                <div className="min-w-0">
                  <p className="font-body-md text-body-md font-medium text-on-surface break-words">
                    {documento.employee_name || '—'}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant break-words">
                    {nombrePlanta(documento.location)} · {Array.isArray(documento.items) ? documento.items.length : 0} equipo(s)
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {!mostrarEstado && (
          <p className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">
            {visibles.length === documentos.length
              ? `${documentos.length} entregas`
              : `${visibles.length} de ${documentos.length} entregas`}
          </p>
        )}
      </div>

      <ConfirmDialog
        abierto={Boolean(eliminando)}
        titulo="Eliminar documento de entrega"
        mensaje={
          eliminando
            ? `¿Desea eliminar la entrega de "${eliminando.employee_name}"? Esta acción no se puede deshacer.${
                errorBorrar ? ` ${errorBorrar}` : ''
              }`
            : ''
        }
        textoConfirmar={borrando ? 'Eliminando...' : 'Sí, eliminar'}
        onCancelar={() => {
          if (borrando) return
          setEliminando(null)
          setErrorBorrar('')
        }}
        onConfirmar={confirmarEliminar}
      />
    </div>
  )
}

export default HistorialEntregaList
