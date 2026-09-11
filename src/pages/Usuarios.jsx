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
  admin: { label: 'Administrador', classes: 'bg-on-surface text-surface' },
  user: { label: 'Usuario', classes: 'border border-outline bg-surface text-on-surface' },
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
    'inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform'

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
    'inline-grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface active:scale-[0.90] transition-transform'

  function verUsuario(usuario) {
    navigate(`/usuarios/${usuario.id}/ver`)
  }

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">Usuarios</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Cuentas con acceso al sistema y su rol.
            </p>
          </div>
          <Link
            to="/usuarios/nuevo"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95 active:scale-[0.97]"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2} />
            Nuevo usuario
          </Link>
        </div>

        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o usuario..." />

        {/* ---- Escritorio: tabla, ojo (ver) + lápiz (editar con confirmación) ---- */}
        <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-xl overflow-x-auto shadow-sm">
          {cargando ? (
            <SkeletonTabla columnas={3} filas={5} />
          ) : sinContenido ? (
            estado
          ) : (
            <table className="w-full min-w-[520px] text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Usuario
                  </th>
                  <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Rol
                  </th>
                  <th className="w-24 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-on-surface divide-y divide-outline-variant">
                {visibles.map((u) => {
                  const rolInfo = ROL_INFO[u.role] || { label: u.role, classes: 'bg-surface-container-high text-on-surface' }
                  return (
                    <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary-container font-label-bold text-[11px] text-on-secondary-container">
                            {iniciales(u.name)}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium text-on-surface truncate">{u.name}</div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant truncate">{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 font-label-sm text-label-sm uppercase tracking-wide ${rolInfo.classes}`}
                        >
                          {rolInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => verUsuario(u)} aria-label={`Ver ${u.name}`} title="Ver" className={iconoActivo}>
                            <Eye className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmando(u)}
                            aria-label={`Editar ${u.name}`}
                            title="Editar"
                            className={iconoActivo}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
            visibles.map((u) => {
              const rolInfo = ROL_INFO[u.role] || { label: u.role, classes: 'bg-surface-container-high text-on-surface' }
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => verUsuario(u)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3.5 text-left shadow-sm transition-all hover:bg-surface-container-low active:scale-[0.99] active:bg-surface-container-low"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary-container font-label-bold text-[11px] text-on-secondary-container">
                      {iniciales(u.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-body-md text-body-md font-medium text-on-surface break-words">{u.name}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant break-words">{u.username}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 font-label-sm text-label-sm uppercase tracking-wide ${rolInfo.classes}`}
                  >
                    {rolInfo.label}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {!cargando && !sinContenido && (
          <p className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">
            {visibles.length === usuarios.length ? `${usuarios.length} usuarios` : `${visibles.length} de ${usuarios.length} usuarios`}
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
