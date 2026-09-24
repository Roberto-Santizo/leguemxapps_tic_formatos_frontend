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
  'inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
// Mismo panel gris de solo lectura que CatalogoRegistroView / EquipoView.
const etiqueta = 'mb-1 font-mono text-micro uppercase leading-4 tracking-[0.1em] text-on-surface-variant'
const panelDato = 'min-w-0 rounded-xl bg-surface-container-high px-4 py-3'

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
    <div className="animate-view-in flex-1 px-4 pt-6 pb-10 md:px-8 md:pt-10">
      {/* Mismo ancho que su formulario (UsuarioForm, 600px): ver y editar de
          una misma entidad no deben cambiar de ancho al pasar de una a otra. */}
      <div className="max-w-[600px] ml-[max(0px,calc((100%_-_1200px)/2))] flex flex-col gap-stack-lg">
        <Link
          to="/usuarios"
          className="inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
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
            {/* Rejilla de 2 columnas: el eyebrow ocupa todo el ancho y "Editar"
                queda siempre a la derecha del título (en móvil no baja a una
                línea propia). El envoltorio del texto es `contents` para no
                cambiar el orden del DOM. */}
            <div className="-mt-1 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 md:mt-0">
              <div className="contents">
                <div className="col-span-2 flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
                  <span aria-hidden="true" className="h-px w-7 bg-outline" />
                  Usuarios / Detalle
                </div>
                <h1 className="col-start-1 row-start-2 mt-1.5 font-display-lg text-titulo-movil md:text-display-lg text-on-surface break-words">
                  {usuario.name}
                </h1>
                <p className="col-start-1 row-start-3 mt-1 font-body-lg text-body-lg text-on-surface-variant">Información completa del usuario.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className={`col-start-2 row-span-2 row-start-2 self-center md:self-end ${botonSecundario}`}
              >
                <Pencil className="h-4 w-4" strokeWidth={1.75} />
                Editar
              </button>
            </div>

            <section className="rounded-tarjeta bg-white p-4 shadow-tarjeta md:p-6">
              <div className="mb-4 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-outline bg-white text-meta font-semibold text-on-surface"
                >
                  {iniciales(usuario.name)}
                </span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Datos del usuario</h2>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div className={panelDato}>
                  <p className={etiqueta}>Usuario</p>
                  <p className="font-mono text-body-md text-on-surface break-all">{usuario.username}</p>
                </div>
                <div className={panelDato}>
                  <p className={etiqueta}>Rol</p>
                  <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-outline-variant bg-white px-2.5 text-meta font-medium text-on-surface">
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
