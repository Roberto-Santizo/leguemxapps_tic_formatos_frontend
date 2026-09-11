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
  admin: { label: 'Administrador', classes: 'bg-on-surface text-surface' },
  user: { label: 'Usuario', classes: 'border border-outline bg-surface text-on-surface' },
}

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
    ? ROL_INFO[usuario.role] || { label: usuario.role, classes: 'bg-surface-container-high text-on-surface' }
    : null

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      {/* Mismo ancho que su formulario (UsuarioForm, 600px): ver y editar de
          una misma entidad no deben cambiar de ancho al pasar de una a otra. */}
      <div className="max-w-[600px] mx-auto flex flex-col gap-stack-md">
        <Link
          to="/usuarios"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest active:scale-[0.97] transition-transform"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Usuarios
        </Link>

        {cargando ? (
          <SkeletonDetalle secciones={1} camposPorSeccion={3} />
        ) : error ? (
          // Mismo estado de error que las listas (EstadoVacio con
          // "Reintentar"), en vez de una línea roja suelta sin ninguna salida.
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <EstadoVacio
              variante="error"
              titulo="No se pudo cargar el usuario"
              descripcion={error}
              accion={
                <button
                  type="button"
                  onClick={() => setIntento((n) => n + 1)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
                >
                  Reintentar
                </button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">{usuario.name}</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Información completa del usuario.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} />
                Editar
              </button>
            </div>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-4">Datos del usuario</h2>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                    Usuario
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">{usuario.username}</p>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                    Rol
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 font-label-sm text-label-sm uppercase tracking-wide ${rolInfo.classes}`}
                  >
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
