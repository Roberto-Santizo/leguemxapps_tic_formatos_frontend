import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Pencil, Plus, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Buscador from '../components/Buscador.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import { SkeletonTabla, SkeletonTarjetas } from '../components/Skeleton.jsx'
import { listarEmpleados, listarDepartamentos } from '../services/api.js'

/**
 * Lista de empleados (GET /employees). Mismo flujo que Equipos/Marcas:
 * escritorio con ojo (ver, sin confirmar) y lápiz (editar, con
 * confirmación); móvil con tarjetas sin botones que llevan directo al
 * detalle, y el "Editar" de esa página pidiendo la misma confirmación.
 */
function EmpleadosList() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [empleados, setEmpleados] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [confirmando, setConfirmando] = useState(null) // empleado o null

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
  // La carga tiene sus propios esqueletos, con la forma de la tabla y de las
  // tarjetas, así que se separa de los estados "sin contenido".
  const sinContenido = !cargando && (Boolean(errorCarga) || !hayRegistros)

  const botonSecundario =
    'inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high'

  const estado = errorCarga ? (
    <EstadoVacio
      variante="error"
      titulo="No se pudo cargar el catálogo"
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
      icon={Users}
      titulo="Aún no hay empleados registrados"
      descripcion="Crea el primero para asignarlo a un departamento."
      accion={
        <Link to="/catalogo/empleados/nuevo" className={botonSecundario}>
          Nuevo empleado
        </Link>
      }
    />
  )

  const iconoActivo =
    'inline-grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface'

  function verEmpleado(emp) {
    navigate(`/catalogo/empleados/${emp.id}/ver`, {
      state: { empleado: { ...emp, departamentoNombre: nombreDepartamento(emp) } },
    })
  }

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

        {/* ---- Escritorio: tabla, ojo (ver) + lápiz (editar con confirmación) ---- */}
        <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {cargando ? (
            <SkeletonTabla columnas={4} filas={5} />
          ) : sinContenido ? (
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
                        <button type="button" onClick={() => verEmpleado(emp)} title="Ver" className={iconoActivo}>
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button type="button" onClick={() => setConfirmando(emp)} title="Editar empleado" className={iconoActivo}>
                          <Pencil className="h-4 w-4" strokeWidth={2} />
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
          {cargando ? (
            <SkeletonTarjetas filas={4} />
          ) : sinContenido ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">{estado}</div>
          ) : (
            visibles.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => verEmpleado(emp)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3.5 text-left shadow-sm transition-all hover:bg-surface-container-low active:scale-[0.99] active:bg-surface-container-low"
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

        {!cargando && !sinContenido && (
          <p className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">
            {visibles.length === empleados.length ? `${empleados.length} empleados` : `${visibles.length} de ${empleados.length} empleados`}
          </p>
        )}
      </div>

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo="Editar empleado"
        mensaje={confirmando ? `¿Desea editar a "${confirmando.name}"?` : ''}
        textoConfirmar="Sí, editar"
        onCancelar={() => setConfirmando(null)}
        onConfirmar={() => navigate(`/catalogo/empleados/${confirmando.id}`)}
      />
    </div>
  )
}

export default EmpleadosList
