import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Loader2, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { mostrarToast } from '../components/Toast.jsx'
import { SkeletonFormulario } from '../components/Skeleton.jsx'
import { obtenerUsuario, crearUsuario, editarUsuario } from '../services/api.js'

/**
 * Alta y edición de un usuario (POST /users, PUT /users/{id}), mismo patrón
 * que EmpleadoForm.jsx: un solo formulario para ambos casos, según si hay
 * :id en la URL.
 *
 * La contraseña es obligatoria al crear, pero opcional al editar -- si se
 * deja en blanco no se manda en el payload y el usuario conserva la que ya
 * tenía (así lo documenta la API).
 */

const inputClasses =
  'h-11 w-full rounded-lg border border-outline-variant bg-surface px-3.5 font-body-md text-body-md text-on-surface transition-colors hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60'

function UsuarioForm() {
  const { id } = useParams()
  const esEdicion = Boolean(id)
  const navigate = useNavigate()
  const { token } = useAuth()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('user')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [erroresCampo, setErroresCampo] = useState(null)

  useEffect(() => {
    if (!esEdicion) return
    let vivo = true
    setCargando(true)
    obtenerUsuario(token, Number(id))
      .then((u) => {
        if (!vivo || !u) return
        setName(u.name ?? '')
        setUsername(u.username ?? '')
        setRole(u.role ?? 'user')
      })
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el usuario'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [esEdicion, id, token])

  const passwordCompleta = esEdicion
    ? !password.trim() || (password.length >= 8 && password === passwordConfirmation)
    : password.length >= 8 && password === passwordConfirmation

  // Avisos en vivo: antes "Crear usuario" solo se quedaba gris, sin decir si
  // faltaban caracteres o si la confirmación no coincidía.
  const faltanCaracteres = password && password.length < 8 ? 8 - password.length : 0
  // Mientras se escribe la confirmación no se reta a nadie: solo se avisa
  // cuando ya no puede terminar coincidiendo, o cuando está completa y es
  // distinta.
  const noCoinciden =
    passwordConfirmation !== '' &&
    passwordConfirmation !== password &&
    !(password.startsWith(passwordConfirmation) && passwordConfirmation.length < password.length)

  const completo = name.trim() && username.trim() && role && passwordCompleta

  async function handleSubmit(e) {
    e.preventDefault()
    if (!completo) return
    setGuardando(true)
    setError('')
    setErroresCampo(null)

    const payload = { name: name.trim(), username: username.trim(), role }
    // Al crear, la contraseña siempre va. Al editar, solo si se escribió algo
    // -- en blanco significa "conservar la actual".
    if (!esEdicion || password.trim()) {
      payload.password = password
      payload.password_confirmation = passwordConfirmation
    }

    try {
      if (esEdicion) {
        await editarUsuario(token, Number(id), payload)
      } else {
        await crearUsuario(token, payload)
      }
      mostrarToast(esEdicion ? 'Usuario actualizado' : 'Usuario creado')
      navigate('/usuarios')
    } catch (err) {
      setError(err.message || 'No se pudo guardar el usuario')
      setErroresCampo(err.errors || null)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[600px] mx-auto flex flex-col gap-stack-lg">
        <Link
          to="/usuarios"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest active:scale-[0.97] transition-transform"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Usuarios
        </Link>

        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
          {esEdicion ? 'Editar usuario' : 'Nuevo usuario'}
        </h1>

        {cargando ? (
          <SkeletonFormulario campos={4} />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-stack-lg">
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm flex flex-col gap-stack-md">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface">Nombre completo</label>
                <input
                  className={inputClasses}
                  value={name}
                  disabled={guardando}
                  maxLength={255}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Roberto Santizo"
                  required
                  autoFocus
                />
                {erroresCampo?.name?.[0] && (
                  <p className="font-label-sm text-label-sm text-error">{erroresCampo.name[0]}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface">Usuario</label>
                <input
                  className={inputClasses}
                  value={username}
                  disabled={guardando}
                  maxLength={255}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. rsantizo"
                  required
                />
                {erroresCampo?.username?.[0] && (
                  <p className="font-label-sm text-label-sm text-error">{erroresCampo.username[0]}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface">Rol</label>
                <select className={inputClasses} value={role} disabled={guardando} onChange={(e) => setRole(e.target.value)}>
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
                {erroresCampo?.role?.[0] && (
                  <p className="font-label-sm text-label-sm text-error">{erroresCampo.role[0]}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface">
                  Contraseña
                  {esEdicion && (
                    <span className="ml-1 font-body-md text-body-md font-normal text-on-surface-variant">
                      (dejar en blanco para no cambiarla)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    className={`${inputClasses} pr-11`}
                    value={password}
                    disabled={guardando}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!esEdicion}
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((v) => !v)}
                    disabled={guardando}
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                    className="absolute right-1 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50 active:scale-[0.90] transition-transform"
                  >
                    {mostrarPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                  </button>
                </div>
                {faltanCaracteres > 0 && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {faltanCaracteres === 1 ? 'Falta 1 carácter' : `Faltan ${faltanCaracteres} caracteres`} (mínimo 8).
                  </p>
                )}
                {erroresCampo?.password?.[0] && (
                  <p className="font-label-sm text-label-sm text-error">{erroresCampo.password[0]}</p>
                )}
              </div>

              {(password || !esEdicion) && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-label-bold text-on-surface">Confirmar contraseña</label>
                  <div className="relative">
                    <input
                      type={mostrarConfirmacion ? 'text' : 'password'}
                      className={`${inputClasses} pr-11`}
                      value={passwordConfirmation}
                      disabled={guardando}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required={!esEdicion || Boolean(password)}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirmacion((v) => !v)}
                      disabled={guardando}
                      aria-label={mostrarConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      tabIndex={-1}
                      className="absolute right-1 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50 active:scale-[0.90] transition-transform"
                    >
                      {mostrarConfirmacion ? (
                        <EyeOff className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                  {noCoinciden && (
                    <p className="font-label-sm text-label-sm text-error">Las contraseñas no coinciden.</p>
                  )}
                </div>
              )}
            </section>

            {error && (
              <p className="font-label-sm text-label-sm text-error rounded-lg border border-error/30 bg-error-container/40 px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                to="/usuarios"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={guardando || !completo}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95 active:scale-[0.97] disabled:opacity-60"
              >
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Save className="h-4 w-4" strokeWidth={2.25} />}
                {esEdicion ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default UsuarioForm
