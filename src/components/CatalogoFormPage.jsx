import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useOrigen } from '../utils/origenNavegacion.js'
import { ArrowLeft, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { IndicadorGuardando, mostrarToast } from './Toast.jsx'
import { SkeletonFormulario } from './Skeleton.jsx'
import IsotipoCarga from './IsotipoCarga.jsx'
// Recetas visuales "Sierra" (BRIEF, ola 2), repetidas a propósito en cada
// pantalla en vez de un componente de botón/campo genérico.
const inputClasses =
  'h-11 w-full rounded-boton border border-outline-variant bg-white px-3 font-body-md text-input-movil text-on-surface placeholder:text-on-surface-subtle transition duration-fast ease-standard hover:[&:not(:focus)]:border-outline disabled:opacity-60 md:text-body-md'
const labelClasses = 'text-meta font-semibold leading-4 text-on-surface'
const botonVolver =
  'inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const botonSecundario =
  'inline-flex h-10 items-center justify-center gap-2 rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const botonPrimario =
  'inline-flex h-10 items-center justify-center gap-2 rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100'

/**
 * Alta y edición de un catálogo simple de un solo campo (`name`): Marcas o
 * Departamentos. Página propia en `rutaBase/nuevo` y `rutaBase/:id`, igual
 * que EquipoForm -- ya no es un modal sobre la lista.
 */
function CatalogoFormPage({ textos, onObtener, onCrear, onActualizar, rutaBase }) {
  const { id } = useParams()
  const esEdicion = Boolean(id)
  const navigate = useNavigate()
  // Editar abierto desde la ficha ("ver") vuelve a la ficha; desde la lista
  // o en "nuevo", a la lista como siempre.
  const origen = useOrigen(rutaBase, textos.titulo)
  const { token } = useAuth()

  const [name, setName] = useState('')
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [erroresCampo, setErroresCampo] = useState(null)

  useEffect(() => {
    if (!esEdicion) return
    let vivo = true
    setCargando(true)
    onObtener(token, Number(id))
      .then((registro) => {
        if (!vivo || !registro) return
        setName(registro.name ?? '')
      })
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el registro'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [esEdicion, id, token, onObtener])

  async function handleSubmit(e) {
    e.preventDefault()
    const limpio = name.trim()
    if (!limpio) return

    setGuardando(true)
    setError('')
    setErroresCampo(null)
    try {
      if (esEdicion) {
        await onActualizar(token, Number(id), { name: limpio })
      } else {
        await onCrear(token, { name: limpio })
      }
      // Confirmación explícita: antes el guardado terminaba en un cambio de
      // pantalla silencioso y el usuario no sabía si había pasado algo.
      mostrarToast(esEdicion ? textos.avisoActualizado : textos.avisoCreado)
      navigate(origen.ruta, { replace: origen.propio })
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
      setErroresCampo(err.errors || null)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="animate-view-in flex-1 px-4 pt-6 pb-10 tablet:px-8 tablet:pt-8 md:px-8 md:pt-10">
      {/* Mismo carril de 1200px que la lista: ver, editar y la lista de un
          catálogo no cambian de ancho al pasar de una a otra. */}
      <div className="mx-auto flex max-w-[1200px] flex-col gap-stack-lg">
        <Link to={origen.ruta} className={botonVolver}>
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {origen.etiqueta}
        </Link>

        <div className="-mt-1 md:mt-0">
          <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
            <span aria-hidden="true" className="h-px w-7 bg-outline" />
            Catálogo / {textos.titulo} / {esEdicion ? 'Editar' : 'Nuevo'}
          </div>
          <h1 className="mt-1.5 font-display-lg text-titulo-movil text-on-surface md:text-display-lg">
            {esEdicion ? textos.tituloEditar : textos.tituloCrear}
          </h1>
        </div>

        {cargando ? (
          <SkeletonFormulario campos={1} />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 rounded-tarjeta bg-white p-4 shadow-tarjeta md:p-6"
          >
            <section className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className={labelClasses}>{textos.labelCampo}</label>
                <input
                  className={inputClasses}
                  value={name}
                  disabled={guardando}
                  maxLength={255}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={textos.placeholderCampo}
                  required
                  autoFocus
                />
                {erroresCampo?.name?.[0] && (
                  <p className="font-label-sm text-label-sm text-error">{erroresCampo.name[0]}</p>
                )}
              </div>
            </section>

            {error && (
              <p className="animate-hint-in font-label-sm text-label-sm text-error rounded-boton border border-error/30 bg-error-container/40 px-3 py-2">
                {error}
              </p>
            )}

            {/* Fila de botones: filete arriba y, como antes del rediseño,
                Cancelar + primario alineados a la derecha (en móvil el
                primario queda arriba, a todo lo ancho). */}
            <div className="flex flex-col-reverse gap-3 border-t border-outline-variant pt-5 sm:flex-row sm:justify-end">
              <Link to={origen.ruta} className={botonSecundario}>
                Cancelar
              </Link>
              <button type="submit" disabled={guardando || !name.trim()} className={botonPrimario}>
                {guardando ? (
                  <IsotipoCarga className="h-3" />
                ) : (
                  <Save className="h-4 w-4" strokeWidth={1.75} />
                )}
                {esEdicion ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </form>
        )}
      </div>

      <IndicadorGuardando activo={guardando} />
    </div>
  )
}

export default CatalogoFormPage
