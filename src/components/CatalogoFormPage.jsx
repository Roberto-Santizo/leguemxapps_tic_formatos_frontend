import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { mostrarToast } from './Toast.jsx'
import { SkeletonFormulario } from './Skeleton.jsx'

const inputClasses =
  'h-11 w-full rounded-lg border border-outline-variant bg-surface px-3.5 font-body-md text-body-md text-on-surface transition-colors hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60'

/**
 * Alta y edición de un catálogo simple de un solo campo (`name`): Marcas o
 * Departamentos. Página propia en `rutaBase/nuevo` y `rutaBase/:id`, igual
 * que EquipoForm -- ya no es un modal sobre la lista.
 */
function CatalogoFormPage({ textos, onObtener, onCrear, onActualizar, rutaBase }) {
  const { id } = useParams()
  const esEdicion = Boolean(id)
  const navigate = useNavigate()
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
      navigate(rutaBase)
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
      setErroresCampo(err.errors || null)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[600px] mx-auto flex flex-col gap-stack-lg">
        <Link
          to={rutaBase}
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest active:scale-[0.97] transition-transform"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          {textos.titulo}
        </Link>

        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">
            {esEdicion ? textos.tituloEditar : textos.tituloCrear}
          </h1>
        </div>

        {cargando ? (
          <SkeletonFormulario campos={1} />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-stack-lg">
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm flex flex-col gap-stack-md">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface">{textos.labelCampo}</label>
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
              <p className="font-label-sm text-label-sm text-error rounded-lg border border-error/30 bg-error-container/40 px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                to={rutaBase}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={guardando || !name.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95 active:scale-[0.97] disabled:opacity-60"
              >
                {guardando ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Save className="h-4 w-4" strokeWidth={2.25} />
                )}
                {esEdicion ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default CatalogoFormPage
