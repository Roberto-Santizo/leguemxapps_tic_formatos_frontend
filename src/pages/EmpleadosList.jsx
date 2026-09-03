import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, Pencil, Plus, Loader2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Buscador from '../components/Buscador.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { listarEmpleados, listarDepartamentos } from '../services/api.js'

/**
 * Lista de empleados (GET /employees). A diferencia de Equipos, todos los
 * registros son iguales entre sí -- sin estados especiales -- así que sigue
 * el mismo patrón simple de Marcas/Departamentos (tabla en escritorio,
 * tarjetas en celular), con el detalle de solo lectura y la confirmación
 * antes de editar que pidió el plan.
 */
function EmpleadosList() {
  const { token } = useAuth()

  const [empleados, setEmpleados] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [verDetalle, setVerDetalle] = useState(null) // empleado o null
  const [confirmarEdicion, setConfirmarEdicion] = useState(null) // empleado o null

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      const [emp, dep] = await Promise.all([listarEmpleados(token), listarDepartamentos(token)])
      setEmpleados(Array.isArray(emp) ? emp : [])
      setDepartamentos(Array.isArray(dep) ? dep : [])
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo obtener la lista de empleados')
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => {
    cargar()
  }, [cargar])

  const nombreDepartamento = useCallback(
    (emp) => emp.department || departamentos.find((d) => d.id === emp.department_id)?.name || '—',
    [departamentos],
  )

  const visibles = useMemo(() => {
    const filtro = busqueda.trim().toLowerCase()
    if (!filtro) return empleados
    return empleados.filter(
      (e) =>
        (e.name || '').toLowerCase().includes(filtro) ||
        (e.code || '').toLowerCase().includes(filtro) ||
        nombreDepartamento(e).toLowerCase().includes(filtro),
    )
  }, [empleados, busqueda, nombreDepartamento])

  const hayRegistros = visibles.length > 0
  const mostrarEstado = cargando || errorCarga || !hayRegistros

  const estado = cargando ? (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-outline" strokeWidth={2} />
      <p className="font-body-md text-body-md text-on-surface-variant">Cargando empleados...</p>
    </div>
  ) : errorCarga ? (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <p className="font-label-bold text-label-bold text-on-surface">No se pudo cargar el catálogo</p>
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
      <p className="font-label-bold text-label-bold text-on-surface">Aún no hay empleados registrados</p>
      <p className="font-body-md text-body-md text-on-surface-variant">Crea el primero para asignarlo a un departamento.</p>
    </div>
  )

  const iconoActivo =
    'inline-grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface'

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <Link
          to="/catalogo"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Catálogo
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">Empleados</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Colaboradores registrados y su departamento asignado.
            </p>
          </div>
          <Link
            to="/catalogo/empleados/nuevo"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2} />
            Nuevo empleado
          </Link>
        </div>

        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por código, nombre o departamento..." />

        {/* ---- Escritorio: tabla ---- */}
        <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {mostrarEstado ? (
            estado
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="w-32 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Código</th>
                  <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Nombre</th>
                  <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Departamento</th>
                  <th className="w-24 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-on-surface divide-y divide-outline-variant">
                {visibles.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4 font-mono text-on-surface-variant">{emp.code}</td>
                    <td className="px-5 py-4 font-medium text-on-surface break-words">{emp.name}</td>
                    <td className="px-5 py-4 text-on-surface-variant break-words">{nombreDepartamento(emp)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setVerDetalle(emp)} title="Ver detalle" className={iconoActivo}>
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <Link to={`/catalogo/empleados/${emp.id}`} title="Editar empleado" className={iconoActivo}>
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ---- Móvil: tarjetas ---- */}
        <div className="md:hidden flex flex-col gap-stack-sm">
          {mostrarEstado ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">{estado}</div>
          ) : (
            visibles.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => setVerDetalle(emp)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-surface-container-low"
              >
                <div className="min-w-0">
                  <p className="font-body-md text-body-md font-medium text-on-surface break-words">{emp.name}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant break-words">
                    {emp.code} · {nombreDepartamento(emp)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {!mostrarEstado && (
          <p className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">
            {visibles.length === empleados.length ? `${empleados.length} empleados` : `${visibles.length} de ${empleados.length} empleados`}
          </p>
        )}
      </div>

      {/* Detalle de solo lectura -- desde el ojo (escritorio) o la tarjeta (móvil) */}
      {verDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4" onClick={() => setVerDetalle(null)}>
          <div className="animate-view-in w-full max-w-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">{verDetalle.name}</h2>
              <button type="button" onClick={() => setVerDetalle(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <dl className="mt-4 flex flex-col gap-2.5">
              <div className="flex justify-between gap-3">
                <dt className="font-label-bold text-label-bold text-on-surface-variant">Código</dt>
                <dd className="font-body-md text-body-md text-on-surface">{verDetalle.code}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-label-bold text-label-bold text-on-surface-variant">Departamento</dt>
                <dd className="font-body-md text-body-md text-on-surface">{nombreDepartamento(verDetalle)}</dd>
              </div>
            </dl>
            <div className="mt-5 flex justify-end gap-2.5 md:hidden">
              <button
                type="button"
                onClick={() => {
                  setConfirmarEdicion(verDetalle)
                  setVerDetalle(null)
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} />
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación antes de editar, solo en el flujo móvil */}
      <ConfirmDialog
        abierto={Boolean(confirmarEdicion)}
        titulo="Editar empleado"
        mensaje={confirmarEdicion ? `¿Desea editar a "${confirmarEdicion.name}"?` : ''}
        textoConfirmar="Sí, editar"
        onCancelar={() => setConfirmarEdicion(null)}
        onConfirmar={() => {
          window.location.assign(`/catalogo/empleados/${confirmarEdicion.id}`)
        }}
      />
    </div>
  )
}

export default EmpleadosList
