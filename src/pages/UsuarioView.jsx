import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { SkeletonDetalle } from '../components/Skeleton.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import { obtenerUsuario } from '../services/api.js'

// Mismos roles que ya usa Usuarios.jsx (lista) y UsuarioForm.jsx (select).
const ROL_INFO = {
  admin: { label: 'Administrador', classes: 'bg-on-surface' },
  user: { label: 'Usuario', classes: 'bg-outline' },
}

// Mismas iniciales que el avatar de la lista (Usuarios.jsx). Solo decorativo.
function iniciales(nombre) {
  if (!nombre) return '—'
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

const botonSecundario =
  'inline-flex h-10 items-center justify-center gap-2 rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const etiqueta = 'mb-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant'

/**
 * Vista completa de un usuario -- destino del ojo/tarjeta en Usuarios.jsx.
 * Carga el registro por ID contra la API (GET /users/{id}), no por estado de
 * navegación, para que funcione con URL directa y con refrescar la página
 * (mismo patrón que EquipoView.jsx). "Editar" pide confirmación antes de
 * entrar al formulario de edición.
 */
function UsuarioView() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  // Sube con "Reintentar" para volver a pedir el usuario tras un error.
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    setError('')
    obtenerUsuario(token, Number(id))
      .then((data) => vivo && setUsuario(data))
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el usuario'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [id, token, intento])

  const rolInfo = usuario
    ? ROL_INFO[usuario.role] || { label: usuario.role, classes: 'bg-outline' }
    : null

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg">
      {/* Mismo ancho que su formulario (UsuarioForm, 600px): ver y editar de
          una misma entidad no deben cambiar de ancho al pasar de una a otra. */}
      <div className="max-w-[600px] mx-auto flex flex-col gap-stack-lg">
        <Link
          to="/usuarios"
          className="inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Usuarios
        </Link>

        {cargando ? (
          <SkeletonDetalle secciones={1} camposPorSeccion={3} />
        ) : error ? (
          // Mismo estado de error que las listas (EstadoVacio con
          // "Reintentar"), en vez de una línea roja suelta sin ninguna salida.
          <div className="rounded-tarjeta bg-white shadow-tarjeta">
            <EstadoVacio
              variante="error"
              titulo="No se pudo cargar el usuario"
              descripcion={error}
              accion={
                <button
                  type="button"
                  onClick={() => setIntento((n) => n + 1)}
                  className={botonSecundario}
                >
                  Reintentar
                </button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start sm:items-end gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
                  <span aria-hidden="true" className="h-px w-7 bg-outline" />
                  Usuarios / Detalle
                </div>
                <h1 className="mt-1.5 font-display-lg text-[26px] leading-[32px] md:text-display-lg text-on-surface break-words">
                  {usuario.name}
                </h1>
                <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">Información completa del usuario.</p>
              </div>
              <button type="button" onClick={() => setConfirmando(true)} className={botonSecundario}>
                <Pencil className="h-4 w-4" strokeWidth={1.75} />
                Editar
              </button>
            </div>

            <section className="animate-pop-in rounded-tarjeta bg-white p-4 shadow-tarjeta sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-outline-variant pb-5">
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-outline bg-white text-[14px] font-semibold text-on-surface"
                >
                  {iniciales(usuario.name)}
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Datos del usuario</h2>
              </div>
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div className="min-w-0">
                  <p className={etiqueta}>Usuario</p>
                  <p className="font-mono text-[13px] text-on-surface break-all">{usuario.username}</p>
                </div>
                <div>
                  <p className={etiqueta}>Rol</p>
                  <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-outline-variant bg-white px-2.5 text-[12px] font-medium text-on-surface">
                    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${rolInfo.classes}`} />
                    {rolInfo.label}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo="Editar usuario"
        mensaje={usuario ? `¿Desea editar a "${usuario.name}"?` : ''}
        textoConfirmar="Sí, editar"
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => navigate(`/usuarios/${id}`)}
      />
    </div>
  )
}

export default UsuarioView
