import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Pencil, Plus, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Buscador from '../components/Buscador.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import { SkeletonTabla, SkeletonTarjetas } from '../components/Skeleton.jsx'
import { listarUsuarios } from '../services/api.js'

function iniciales(nombre) {
  if (!nombre) return '—'
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

// Solo quedan dos roles: admin (todas las funciones) y user (restringido a
// Historial: ver actas y corregir solo la fecha de encabezado y la fecha de
// cada registro). "adminagricola" se retiró.
const ROL_INFO = {
  admin: { label: 'Administrador', classes: 'bg-on-surface' },
  user: { label: 'Usuario', classes: 'bg-outline' },
}

/**
 * Lista de usuarios (GET /users, solo admin). Mismo flujo que
 * Equipos/Empleados: escritorio con ojo (ver, sin confirmar) y lápiz
 * (editar, con confirmación); móvil con tarjetas sin botones que llevan
 * directo al detalle. "Nuevo usuario" y "Editar" son páginas dedicadas
 * (/usuarios/nuevo, /usuarios/:id), no modales.
 */
function Usuarios() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [confirmando, setConfirmando] = useState(null) // usuario o null

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      const data = await listarUsuarios(token)
      setUsuarios(Array.isArray(data) ? data : [])
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo obtener la lista de usuarios')
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => {
    cargar()
  }, [cargar])

  const visibles = useMemo(() => {
    const filtro = busqueda.trim().toLowerCase()
    if (!filtro) return usuarios
    return usuarios.filter(
      (u) => (u.name || '').toLowerCase().includes(filtro) || (u.username || '').toLowerCase().includes(filtro),
    )
  }, [usuarios, busqueda])

  const hayRegistros = visibles.length > 0
  // La carga tiene sus propios esqueletos, con la forma de la tabla y de las
  // tarjetas, así que se separa de los estados "sin contenido".
  const sinContenido = !cargando && (Boolean(errorCarga) || !hayRegistros)

  const botonSecundario =
    'inline-flex h-10 items-center justify-center gap-2 rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'

  const estado = errorCarga ? (
    <EstadoVacio
      variante="error"
      titulo="No se pudo cargar la lista"
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
      titulo="Aún no hay usuarios registrados"
      descripcion="Crea el primero para darle acceso al sistema."
      accion={
        <Link to="/usuarios/nuevo" className={botonSecundario}>
          Nuevo usuario
        </Link>
      }
    />
  )

  const iconoActivo =
    'inline-flex h-9 w-9 items-center justify-center rounded-boton text-on-surface-variant transition duration-fast ease-standard hover:bg-surface-container hover:text-on-surface active:scale-[0.90]'
  // Avatar con iniciales: círculo blanco con filete, como el mockup.
  const avatar =
    'grid shrink-0 place-items-center rounded-full border border-outline bg-white font-semibold text-on-surface'
  const chipRol =
    'inline-flex h-6 items-center gap-1.5 rounded-full border border-outline-variant bg-white px-2.5 text-meta font-medium text-on-surface whitespace-nowrap'
  const th = 'h-11 px-4 font-mono text-micro font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap'
  const conteo =
    visibles.length === usuarios.length ? `${usuarios.length} usuarios` : `${visibles.length} de ${usuarios.length} usuarios`

  function verUsuario(usuario) {
    navigate(`/usuarios/${usuario.id}/ver`)
  }

  return (
    <div className="animate-view-in flex-1 px-4 pt-6 pb-10 md:px-8 md:pt-10">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
              <span aria-hidden="true" className="h-px w-7 bg-outline" />
              Usuarios
            </div>
            <h1 className="mt-1.5 font-display-lg text-titulo-movil md:text-display-lg text-on-surface">Usuarios</h1>
            <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
              Cuentas con acceso al sistema y su rol.
            </p>
          </div>
          <Link
            to="/usuarios/nuevo"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Nuevo usuario
          </Link>
        </div>

        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o usuario..." />

        {/* ---- Escritorio: tabla, ojo (ver) + lápiz (editar con confirmación) ---- */}
        <div className="hidden md:block overflow-hidden rounded-tarjeta bg-white shadow-tarjeta">
          {cargando ? (
            <SkeletonTabla columnas={3} filas={5} />
          ) : sinContenido ? (
            estado
          ) : (
            <>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container">
                  <th className={th}>Usuario</th>
                  <th className={`w-56 ${th}`}>Rol</th>
                  <th className={`w-28 text-right ${th}`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {visibles.map((u) => {
                  const rolInfo = ROL_INFO[u.role] || { label: u.role, classes: 'bg-outline' }
                  return (
                    <tr
                      key={u.id}
                      className="h-[72px] border-t border-outline-variant transition-colors duration-fast hover:bg-surface-container"
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={`h-8 w-8 text-meta ${avatar}`}>{iniciales(u.name)}</span>
                          <div className="min-w-0">
                            <div className="font-medium text-on-surface truncate">{u.name}</div>
                            <div className="font-mono text-meta text-on-surface-variant truncate">{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={chipRol}>
                          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${rolInfo.classes}`} />
                          {rolInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => verUsuario(u)} aria-label={`Ver ${u.name}`} title="Ver" className={iconoActivo}>
                            <Eye className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmando(u)}
                            aria-label={`Editar ${u.name}`}
                            title="Editar"
                            className={iconoActivo}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
            {/* Pie de la tabla, como el mockup: conteo en mono sobre gris. */}
            <div className="flex h-12 items-center border-t border-outline-variant bg-surface-container px-4 font-mono text-micro uppercase tracking-[0.1em] text-on-surface-variant tabular-nums">
              {conteo}
            </div>
            </>
          )}
        </div>

        {/* ---- Móvil: tarjetas apiladas, sin botones -- toda la tarjeta lleva al detalle ---- */}
        <div className="md:hidden flex flex-col gap-stack-sm">
          {cargando ? (
            <SkeletonTarjetas filas={4} />
          ) : sinContenido ? (
            <div className="rounded-tarjeta bg-white shadow-tarjeta">{estado}</div>
          ) : (
            visibles.map((u) => {
              const rolInfo = ROL_INFO[u.role] || { label: u.role, classes: 'bg-outline' }
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => verUsuario(u)}
                  className="flex w-full items-center justify-between gap-3 rounded-tarjeta bg-white p-4 text-left shadow-tarjeta transition duration-fast ease-standard hover:bg-surface-container-low active:scale-[0.99]"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span className={`h-10 w-10 text-meta ${avatar}`}>{iniciales(u.name)}</span>
                    <div className="min-w-0">
                      <p className="font-body-md text-body-md font-semibold text-on-surface break-words">{u.name}</p>
                      <p className="font-mono text-meta text-on-surface-variant break-all">{u.username}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 ${chipRol}`}>
                    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${rolInfo.classes}`} />
                    {rolInfo.label}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {!cargando && !sinContenido && (
          <p className="md:hidden px-1 font-mono text-micro uppercase tracking-[0.1em] text-on-surface-variant tabular-nums">
            {conteo}
          </p>
        )}
      </div>

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo="Editar usuario"
        mensaje={confirmando ? `¿Desea editar a "${confirmando.name}"?` : ''}
        textoConfirmar="Sí, editar"
        onCancelar={() => setConfirmando(null)}
        onConfirmar={() => navigate(`/usuarios/${confirmando.id}`)}
      />
    </div>
  )
}

export default Usuarios
