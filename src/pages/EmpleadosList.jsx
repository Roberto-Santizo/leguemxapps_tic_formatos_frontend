import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Pencil, Plus, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useListaPaginada } from '../hooks/usePaginacion.js'
import Buscador from '../components/Buscador.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import Paginador from '../components/Paginador.jsx'
import { SkeletonTabla, SkeletonTarjetas } from '../components/Skeleton.jsx'
import { listarEmpleados, listarDepartamentos } from '../services/api.js'

/**
 * Lista de empleados (GET /employees). Mismo flujo que Equipos/Marcas:
 * escritorio con ojo (ver, sin confirmar) y lápiz (editar, con
 * confirmación); móvil con tarjetas sin botones que llevan directo al
 * detalle, y el "Editar" de esa página pidiendo la misma confirmación.
 *
 * Paginación y búsqueda en la URL (`?page=2&limit=20&q=juan`) vía useListaPaginada:
 * /employees se pide por página; la búsqueda trae todo una vez y filtra en
 * el cliente. Departamentos se pide completo (es apoyo para el nombre).
 */
// Recetas visuales "Sierra" (BRIEF, ola 2), repetidas a propósito.
const botonVolver =
  'inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const botonPrimario =
  'inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97]'
const celdaEncabezado =
  'h-11 px-4 font-mono text-micro font-medium uppercase tracking-[0.1em] text-on-surface-variant whitespace-nowrap'

function EmpleadosList() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [departamentos, setDepartamentos] = useState([])
  const [confirmando, setConfirmando] = useState(null) // empleado o null

  const nombreDepartamento = useCallback(
    (emp) => emp.department || departamentos.find((d) => d.id === emp.department_id)?.name || '—',
    [departamentos],
  )

  const filtrarEmpleado = useCallback(
    (e, filtro) =>
      (e.name || '').toLowerCase().includes(filtro) ||
      (e.code || '').toLowerCase().includes(filtro) ||
      nombreDepartamento(e).toLowerCase().includes(filtro),
    [nombreDepartamento],
  )

  const {
    registros: visibles,
    total,
    pagina,
    limite,
    ultimaPagina,
    busqueda,
    setBusqueda,
    limpiarBusqueda,
    irAPagina,
    cargando,
    error: errorCarga,
    recargar,
  } = useListaPaginada({
    token,
    listar: listarEmpleados,
    filtrar: filtrarEmpleado,
    mensajeError: 'No se pudo obtener la lista de empleados',
  })

  // Departamentos completos (sin `limit`): solo sirven para traducir
  // department_id a nombre cuando el empleado no trae `department`; si falla
  // se muestra "—" en vez de tumbar la lista.
  const cargarDepartamentos = useCallback(async () => {
    try {
      const dep = await listarDepartamentos(token)
      setDepartamentos(Array.isArray(dep) ? dep : [])
    } catch {
      setDepartamentos([])
    }
  }, [token])

  useEffect(() => {
    cargarDepartamentos()
  }, [cargarDepartamentos])

  // "Reintentar": vuelve a pedir la página y los departamentos.
  const cargar = useCallback(() => {
    recargar()
    cargarDepartamentos()
  }, [recargar, cargarDepartamentos])

  const hayRegistros = visibles.length > 0
  // La carga tiene sus propios esqueletos, con la forma de la tabla y de las
  // tarjetas, así que se separa de los estados "sin contenido".
  const sinContenido = !cargando && (Boolean(errorCarga) || !hayRegistros)

  const botonSecundario =
    'inline-flex h-10 items-center justify-center gap-2 rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'

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
        <button type="button" onClick={limpiarBusqueda} className={botonSecundario}>
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
    'inline-flex h-9 w-9 items-center justify-center rounded-boton text-on-surface-variant transition duration-fast ease-standard hover:bg-surface-container hover:text-on-surface active:scale-[0.90]'

  function verEmpleado(emp) {
    navigate(`/catalogo/empleados/${emp.id}/ver`, {
      state: { empleado: { ...emp, departamentoNombre: nombreDepartamento(emp) } },
    })
  }

  return (
    <div className="animate-view-in flex-1 px-4 pt-6 pb-10 md:px-8 md:pt-10">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <Link to="/catalogo" className={botonVolver}>
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Catálogo
        </Link>

        <div className="-mt-1 md:mt-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
              <span aria-hidden="true" className="h-px w-7 bg-outline" />
              Catálogo / Empleados
            </div>
            <h1 className="mt-1.5 font-display-lg text-titulo-movil text-on-surface md:text-display-lg">
              Empleados
            </h1>
            <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
              Colaboradores registrados y su departamento asignado.
            </p>
          </div>
          <Link to="/catalogo/empleados/nuevo" className={botonPrimario}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Nuevo empleado
          </Link>
        </div>

        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por código, nombre o departamento..." />

        {/* Tabla + paginador en una sola tarjeta en escritorio (patrón de
            Historial); en móvil el envoltorio no dibuja nada. */}
        <div className="flex flex-col gap-stack-lg md:gap-0 md:overflow-hidden md:rounded-tarjeta md:bg-white md:shadow-tarjeta">
        {/* ---- Escritorio: tabla, ojo (ver) + lápiz (editar con confirmación) ---- */}
        <div className="hidden md:block overflow-x-auto">
          {cargando ? (
            <SkeletonTabla columnas={4} filas={5} />
          ) : sinContenido ? (
            estado
          ) : (
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container">
                  <th className={`w-32 ${celdaEncabezado}`}>Código</th>
                  <th className={celdaEncabezado}>Nombre</th>
                  <th className={celdaEncabezado}>Departamento</th>
                  <th className={`w-24 text-right ${celdaEncabezado}`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {visibles.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-t border-outline-variant transition-colors duration-fast ease-standard hover:bg-surface-container-low"
                  >
                    <td className="h-[72px] px-4 py-4 font-mono text-meta text-on-surface-variant">{emp.code}</td>
                    <td className="px-4 py-4 font-medium text-on-surface break-words">{emp.name}</td>
                    <td className="px-4 py-4 text-on-surface-variant break-words">{nombreDepartamento(emp)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => verEmpleado(emp)} title="Ver" className={iconoActivo}>
                          <Eye className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <button type="button" onClick={() => setConfirmando(emp)} title="Editar empleado" className={iconoActivo}>
                          <Pencil className="h-4 w-4" strokeWidth={1.75} />
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
            <div className="rounded-tarjeta bg-white shadow-tarjeta">{estado}</div>
          ) : (
            visibles.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => verEmpleado(emp)}
                className="flex w-full items-center justify-between gap-3 rounded-tarjeta bg-white p-4 text-left shadow-tarjeta transition duration-fast ease-standard active:scale-[0.99] active:bg-surface-container-low"
              >
                <div className="min-w-0">
                  <p className="font-body-md text-body-md font-semibold text-on-surface break-words">{emp.name}</p>
                  <p className="mt-0.5 text-meta leading-4 text-on-surface-variant break-words">
                    <span className="font-mono">{emp.code}</span> · {nombreDepartamento(emp)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {!cargando && !errorCarga && (
          <div className="md:border-t md:border-outline-variant md:bg-surface-container md:px-4 md:py-2.5">
            <Paginador
              pagina={pagina}
              ultimaPagina={ultimaPagina}
              tamano={limite}
              total={total}
              plural="empleados"
              onCambiar={irAPagina}
              enPie
            />
          </div>
        )}
        </div>
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
