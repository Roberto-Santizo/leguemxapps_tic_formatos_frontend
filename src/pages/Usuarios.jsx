import { useEffect, useState } from 'react'
import { UserPlus, X, CheckCircle2, Users, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { registrarUsuario } from '../services/api.js'
import EstadoVacio from '../components/EstadoVacio.jsx'

function iniciales(nombre) {
  if (!nombre) return '—'
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

// Roles tal como los define la API de Laravel (ver componente Role del
// spec): admin, adminagricola, user.
const ROL_INFO = {
  admin: { label: 'Administrador', classes: 'bg-on-surface text-surface' },
  adminagricola: { label: 'Admin Agrícola', classes: 'border border-outline bg-surface text-on-surface' },
  user: { label: 'Usuario', classes: 'border border-outline bg-surface text-on-surface' },
}

const inputClasses =
  'h-11 w-full rounded-lg border border-outline-variant bg-surface px-3.5 font-body-md text-body-md text-on-surface transition-colors hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60'

/**
 * Modal para registrar un usuario nuevo (POST /register de Laravel).
 * De momento no hay edición: la API todavía no expone un endpoint para
 * editar o eliminar usuarios existentes.
 *
 * Entra y sale con la misma transición corta que ConfirmDialog (150ms,
 * opacidad + escala) -- antes aparecía y desaparecía de golpe, distinto al
 * resto de los diálogos del sistema.
 */
function RegistrarUsuarioModal({ abierto, procesando, error, erroresCampo, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    password_confirmation: '',
    role: 'user',
  })

  const [montado, setMontado] = useState(abierto)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (abierto) {
      setMontado(true)
      let frame2
      const frame1 = requestAnimationFrame(() => {
        frame2 = requestAnimationFrame(() => setVisible(true))
      })
      return () => {
        cancelAnimationFrame(frame1)
        if (frame2) cancelAnimationFrame(frame2)
      }
    }
    setVisible(false)
    const t = setTimeout(() => setMontado(false), 150)
    return () => clearTimeout(t)
  }, [abierto])

  if (!montado) return null

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onGuardar(form, () => setForm({ name: '', username: '', password: '', password_confirmation: '', role: 'user' }))
  }

  function errorDe(campo) {
    return erroresCampo?.[campo]?.[0]
  }

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/40 px-4 transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className={`bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-lg border border-outline-variant overflow-hidden transition-all duration-150 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h3 className="font-headline-lg text-headline-lg text-on-surface">Registrar usuario</h3>
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            aria-label="Cerrar"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-50 active:scale-[0.97] transition-transform"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-stack-md">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface">Nombre completo</label>
            <input
              className={inputClasses}
              value={form.name}
              disabled={procesando}
              onChange={(e) => actualizar('name', e.target.value)}
              required
              maxLength={255}
              autoFocus
            />
            {errorDe('name') && (
              <p className="font-label-sm text-label-sm text-error">{errorDe('name')}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface">Usuario</label>
            <input
              className={inputClasses}
              value={form.username}
              disabled={procesando}
              onChange={(e) => actualizar('username', e.target.value)}
              required
              maxLength={255}
              placeholder="ej. jperez"
            />
            {errorDe('username') && (
              <p className="font-label-sm text-label-sm text-error">{errorDe('username')}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface">Contraseña</label>
            <input
              type="password"
              className={inputClasses}
              value={form.password}
              disabled={procesando}
              onChange={(e) => actualizar('password', e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
            />
            {errorDe('password') && (
              <p className="font-label-sm text-label-sm text-error">{errorDe('password')}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface">Confirmar contraseña</label>
            <input
              type="password"
              className={inputClasses}
              value={form.password_confirmation}
              disabled={procesando}
              onChange={(e) => actualizar('password_confirmation', e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface">Rol</label>
            <select
              className={inputClasses}
              value={form.role}
              disabled={procesando}
              onChange={(e) => actualizar('role', e.target.value)}
            >
              <option value="user">Usuario</option>
              <option value="adminagricola">Admin Agrícola</option>
              <option value="admin">Administrador</option>
            </select>
            {errorDe('role') && (
              <p className="font-label-sm text-label-sm text-error">{errorDe('role')}</p>
            )}
          </div>

          {error && (
            <p className="text-error font-label-sm text-label-sm bg-error-container/40 border border-error/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancelar}
              disabled={procesando}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60 active:scale-[0.97] transition-transform"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={procesando}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95 active:scale-[0.97] disabled:opacity-60"
            >
              {procesando ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <UserPlus className="h-4 w-4" strokeWidth={2} />
              )}
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Usuarios() {
  const { token } = useAuth()

  // La API de Laravel todavía no expone un endpoint para LISTAR usuarios --
  // solo para crearlos (POST /register). Así que en vez de simular una
  // tabla completa, esta lista solo guarda (en memoria, mientras dure la
  // sesión) los usuarios que se van registrando aquí, a modo de
  // confirmación visual. No es el directorio completo de usuarios.
  const [registradosEnSesion, setRegistradosEnSesion] = useState([])

  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState('')
  const [erroresCampo, setErroresCampo] = useState(null)

  function abrirCrear() {
    setErrorModal('')
    setErroresCampo(null)
    setModalAbierto(true)
  }

  async function handleGuardar(datos, limpiarForm) {
    setGuardando(true)
    setErrorModal('')
    setErroresCampo(null)
    try {
      const creado = await registrarUsuario(token, datos)
      setRegistradosEnSesion((lista) => [creado, ...lista])
      setModalAbierto(false)
      limpiarForm()
    } catch (err) {
      setErrorModal(err.message || 'No se pudo registrar el usuario')
      setErroresCampo(err.errors || null)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <div className="flex-1 animate-view-in p-container-padding md:p-stack-lg bg-background">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">Usuarios</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Registra nuevas cuentas de acceso al sistema. El listado, edición y eliminación de usuarios
                existentes todavía no están disponibles en el backend.
              </p>
            </div>
            <button
              onClick={abrirCrear}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95 active:scale-[0.97]"
            >
              <UserPlus className="h-4.5 w-4.5" strokeWidth={2} />
              Registrar usuario
            </button>
          </div>

          {/* Usuarios registrados en esta sesión */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            {registradosEnSesion.length === 0 ? (
              <EstadoVacio
                icon={Users}
                titulo="Aún no has registrado ningún usuario"
                descripcion="Los usuarios que registres en esta sesión aparecerán aquí."
                accion={
                  <button
                    type="button"
                    onClick={abrirCrear}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
                  >
                    <UserPlus className="h-4 w-4" strokeWidth={2} />
                    Registrar usuario
                  </button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                        Usuario
                      </th>
                      <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                        Rol
                      </th>
                      <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap text-right">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-on-surface divide-y divide-outline-variant">
                    {registradosEnSesion.map((u) => {
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
                                <div className="font-label-sm text-label-sm text-on-surface-variant truncate">
                                  {u.username}
                                </div>
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
                          <td className="px-5 py-4 text-right">
                            <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                              <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={2} />
                              Registrado
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <RegistrarUsuarioModal
        abierto={modalAbierto}
        procesando={guardando}
        error={errorModal}
        erroresCampo={erroresCampo}
        onGuardar={handleGuardar}
        onCancelar={() => setModalAbierto(false)}
      />
    </>
  )
}

export default Usuarios
