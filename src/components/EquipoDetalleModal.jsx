import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, X } from 'lucide-react'
import {
  obtenerEquipo,
  obtenerMarca,
  obtenerCaracteristicasDeEquipo,
  actualizarEquipo,
  listarMarcas,
} from '../services/api.js'
import { etiquetaTipoEquipo, TIPOS_EQUIPO } from '../pages/EquipoForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import IsotipoCarga from './IsotipoCarga.jsx'
import { IndicadorGuardando, mostrarToast } from './Toast.jsx'

/**
 * Ficha del equipo en ventana emergente. La abre el ojo del buscador de
 * equipo en Entrega de Equipo (FormatoActa → SearchableSelect
 * `onVerDetalle`) para revisar modelo, serie y características ANTES de
 * dejarlo en el acta, sin salir del formulario a mitad de llenado.
 *
 * No sustituye a Catálogo → Equipos → Ver, que sigue siendo la página
 * completa (con historial). Por eso tampoco carga el historial de
 * asignaciones.
 *
 * Edición en la misma ficha (`editable`, solo admin): botón "Editar" que
 * vuelve editables nombre, modelo, marca, serie, tipo, original y usado, y
 * guarda con el mismo PUT /equipments/{id} de EquipoForm, con la misma
 * validación (los cinco campos obligatorios) y los errores 422 bajo cada
 * campo. EXCEPCIÓN documentada a la regla "Editar es una página dedicada":
 * se edita aquí porque quien la abre está a mitad de un acta y salir de la
 * página le haría perder lo que lleva. Las características se siguen
 * editando en Catálogo → Equipos. Mientras se edita, el clic fuera no cierra
 * la ficha y Escape solo sale del modo edición (no se pierde lo escrito por
 * accidente). Al guardar se avisa con `onActualizado(equipo)` para que la
 * pantalla refresque sus listas.
 *
 * Carga por ID contra la API (obtenerEquipo + obtenerMarca +
 * obtenerCaracteristicasDeEquipo, la misma composición que EquipoView) en
 * lugar de fiarse del renglón del listado, que solo trae nombre y marca.
 * Marca y características van con `.catch` propio: si fallan se muestra
 * "—" / "No tiene características" en vez de tumbar la ficha entera.
 *
 * Misma mecánica de ventana que ConfirmDialog (portal a document.body,
 * fondo oscuro, 200ms de opacidad + escala, Escape y clic fuera cierran).
 *
 * `equipoId`: id del equipo a mostrar; null/'' = cerrado.  ·  `onCerrar()`
 * `editable` (opcional): ofrece "Editar" (solo si el usuario es admin).
 * `onActualizado(equipo)` (opcional): se llama tras guardar cambios.
 */
const inputClasses =
  'h-11 w-full rounded-boton border border-outline-variant bg-white px-3 font-body-md text-input-movil text-on-surface placeholder:text-on-surface-subtle transition duration-fast ease-standard hover:[&:not(:focus)]:border-outline disabled:opacity-60 md:text-body-md'
const labelClasses = 'mb-1.5 block text-meta font-semibold leading-4 text-on-surface'
const errorCampo = 'mt-1 text-meta leading-4 text-error'

function EquipoDetalleModal({ equipoId, onCerrar, editable = false, onActualizado }) {
  const { token, isAdmin } = useAuth()
  const puedeEditar = editable && isAdmin
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState(null)
  const [marcas, setMarcas] = useState(null) // null = sin pedir todavía
  const [guardando, setGuardando] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')
  const [erroresCampo, setErroresCampo] = useState(null)
  const abierto = Boolean(equipoId)
  const cajaRef = useRef(null)
  const cerrarRef = useRef(null)
  const nombreRef = useRef(null)
  const editarRef = useRef(null)
  const estabaEditando = useRef(false)

  // Foco al cambiar de modo: al entrar a editar, al campo Nombre; al salir
  // (Guardar, Cancelar, Escape o la X), de vuelta al botón Editar -- antes
  // caía en <body> y el teclado quedaba fuera de la ficha.
  useEffect(() => {
    if (editando) {
      estabaEditando.current = true
      const t = setTimeout(() => nombreRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
    if (estabaEditando.current) {
      estabaEditando.current = false
      const t = setTimeout(() => (editarRef.current ?? cerrarRef.current)?.focus(), 0)
      return () => clearTimeout(t)
    }
    return undefined
  }, [editando])

  // Tab y Shift+Tab dan la vuelta dentro de la ficha (no se escapan a la
  // página de atrás mientras está abierta).
  function retenerFoco(e) {
    if (e.key !== 'Tab' || !cajaRef.current) return
    const enfocables = [...cajaRef.current.querySelectorAll('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])')].filter(
      (el) => !el.disabled && el.offsetParent !== null,
    )
    if (enfocables.length === 0) return
    const primero = enfocables[0]
    const ultimo = enfocables[enfocables.length - 1]
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault()
      ultimo.focus()
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault()
      primero.focus()
    }
  }

  const [montado, setMontado] = useState(abierto)
  const [visible, setVisible] = useState(false)
  const [equipo, setEquipo] = useState(null)
  const [marca, setMarca] = useState(null)
  const [caracteristicas, setCaracteristicas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  // Monta antes de animar la entrada y espera la transición de salida antes
  // de desmontar (igual que ConfirmDialog).
  useEffect(() => {
    if (abierto) {
      setMontado(true)
      return
    }
    setVisible(false)
    const t = setTimeout(() => setMontado(false), 200)
    return () => clearTimeout(t)
  }, [abierto])

  useLayoutEffect(() => {
    if (!montado || !abierto) return
    // eslint-disable-next-line no-unused-expressions
    cajaRef.current?.offsetHeight
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [montado, abierto])

  // Al cerrar (o cambiar de equipo) se sale siempre del modo edición.
  useEffect(() => {
    if (!abierto) {
      setEditando(false)
      setErrorEdicion('')
      setErroresCampo(null)
    }
  }, [abierto, equipoId])

  useEffect(() => {
    if (!abierto) return
    function onKey(e) {
      if (e.key !== 'Escape' || guardando) return
      if (editando) setEditando(false)
      else onCerrar?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [abierto, onCerrar, editando, guardando])

  function empezarEdicion() {
    setForm({
      name: equipo?.name ?? '',
      model: equipo?.model ?? '',
      brand_id: equipo?.brand_id ? String(equipo.brand_id) : '',
      serie: equipo?.serie ?? '',
      type: equipo?.type ?? '',
      original: Boolean(equipo?.original),
      is_used: Boolean(equipo?.is_used),
    })
    setErrorEdicion('')
    setErroresCampo(null)
    setEditando(true)
    if (marcas === null) {
      listarMarcas(token)
        .then((data) => setMarcas(Array.isArray(data) ? data : []))
        .catch(() => setMarcas([]))
    }
  }

  const completo =
    form && form.name.trim() && form.model.trim() && form.brand_id && form.serie.trim() && form.type.trim()

  async function guardarEdicion(e) {
    e.preventDefault()
    if (!completo || guardando) return
    setGuardando(true)
    setErrorEdicion('')
    setErroresCampo(null)
    const payload = {
      name: form.name.trim(),
      model: form.model.trim(),
      brand_id: Number(form.brand_id),
      serie: form.serie.trim(),
      type: form.type.trim(),
      original: Boolean(form.original),
      is_used: Boolean(form.is_used),
    }
    try {
      await actualizarEquipo(token, Number(equipoId), payload)
      const actualizado = { ...equipo, ...payload }
      setEquipo(actualizado)
      const marcaElegida = (marcas || []).find((m) => String(m.id) === String(payload.brand_id))
      if (marcaElegida) setMarca(marcaElegida)
      setEditando(false)
      mostrarToast('Equipo actualizado')
      onActualizado?.(actualizado)
    } catch (err) {
      setErrorEdicion(err.message || 'No se pudo guardar el equipo')
      setErroresCampo(err.errors || null)
    } finally {
      setGuardando(false)
    }
  }

  const errorDe = (campo) => erroresCampo?.[campo]?.[0]
  const erroresVisibles = ['name', 'model', 'brand_id', 'serie', 'type'].map(errorDe).filter(Boolean)
  const errorGeneral = errorEdicion && !erroresVisibles.includes(errorEdicion) ? errorEdicion : ''
  const actualizarCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  useEffect(() => {
    if (!abierto) return
    const t = setTimeout(() => cerrarRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [abierto])

  // Se vuelve a pedir cada vez que se abre (o se cambia de equipo): la ficha
  // es chica y así nunca muestra datos viejos si alguien editó el equipo en
  // otra pestaña.
  useEffect(() => {
    if (!abierto) return
    let vivo = true
    setCargando(true)
    setError('')
    setEquipo(null)
    setMarca(null)
    setCaracteristicas([])
    obtenerEquipo(token, Number(equipoId))
      .then((eq) => {
        if (!vivo) return null
        setEquipo(eq)
        return Promise.all([
          eq.brand_id ? obtenerMarca(token, Number(eq.brand_id)).catch(() => null) : Promise.resolve(null),
          obtenerCaracteristicasDeEquipo(token, Number(equipoId)).catch(() => []),
        ])
      })
      .then((resto) => {
        if (!vivo || !resto) return
        const [marcaObtenida, caracts] = resto
        setMarca(marcaObtenida)
        setCaracteristicas(Array.isArray(caracts) ? caracts : [])
      })
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el equipo'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [abierto, equipoId, intento, token])

  if (!montado) return null

  const dato = (label, valor) => (
    <div className="min-w-0">
      <p className="mb-1 font-mono text-micro uppercase leading-4 tracking-[0.1em] text-on-surface-variant">{label}</p>
      <p className="break-words font-body-md text-body-md font-medium text-on-surface">{valor}</p>
    </div>
  )

  const barra = 'animate-pulse motion-reduce:animate-none rounded bg-surface-container-high'

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-tinta/40 p-4 transition-opacity ease-standard sm:p-6 ${
        visible ? 'opacity-100 duration-base' : 'opacity-0 duration-fast'
      }`}
      onClick={editando || guardando ? undefined : onCerrar}
    >
      <div
        ref={cajaRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="equipo-detalle-titulo"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={retenerFoco}
        className={`flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-tarjeta bg-white shadow-modal transition-[opacity,transform] ease-standard ${
          visible ? 'scale-100 opacity-100 duration-base' : 'scale-95 opacity-0 duration-fast'
        }`}
      >
        {/* Cabecera: eyebrow + nombre + marca · modelo. El botón de cerrar
            va arriba a la derecha, como en el resto de ventanas del sistema. */}
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant px-6 pb-4 pt-6">
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
              <span aria-hidden="true" className="h-px w-7 bg-outline" />
              {editando ? 'Editar equipo' : 'Ficha del equipo'}
            </p>
            {cargando ? (
              <>
                <div className={`${barra} h-5 w-3/5`} />
                <div className={`${barra} mt-2 h-3.5 w-2/5`} />
              </>
            ) : (
              <>
                <h2
                  id="equipo-detalle-titulo"
                  className="break-words font-headline-md text-titulo-modal text-on-surface"
                >
                  {equipo?.name ?? 'Equipo'}
                </h2>
                {equipo && (
                  <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
                    {[marca?.name, equipo.model].filter(Boolean).join(' · ') || 'Sin marca ni modelo'}
                  </p>
                )}
              </>
            )}
          </div>
          <button
            ref={cerrarRef}
            type="button"
            // En modo edición la X hace lo mismo que Escape: sale de la edición
            // sin cerrar la ficha, para no perder lo escrito por accidente.
            onClick={editando ? () => setEditando(false) : onCerrar}
            disabled={guardando}
            aria-label={editando ? 'Cancelar edición' : 'Cerrar'}
            title={editando ? 'Cancelar edición' : 'Cerrar'}
            className="inline-flex h-9 w-9 disabled:opacity-50 shrink-0 items-center justify-center rounded-boton text-on-surface-variant transition duration-fast ease-standard hover:bg-surface-container hover:text-on-surface active:scale-[0.90]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="flex flex-col items-start gap-3 px-6 py-5">
              <p className="rounded-boton border border-error/30 bg-error-container/40 px-3 py-2 font-label-sm text-label-sm text-error">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setIntento((n) => n + 1)}
                className="inline-flex h-10 items-center justify-center rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
              >
                Reintentar
              </button>
            </div>
          ) : cargando ? (
            <div className="flex flex-col gap-5 px-6 py-5" aria-hidden="true">
              <div className={`${barra} h-8 w-1/2`} />
              <div className="grid grid-cols-3 gap-4">
                <div className={`${barra} h-3.5 w-full`} />
                <div className={`${barra} h-3.5 w-full`} />
                <div className={`${barra} h-3.5 w-full`} />
              </div>
              <div className={`${barra} h-3.5 w-2/3`} />
              <div className={`${barra} h-3.5 w-1/2`} />
            </div>
          ) : editando && form ? (
            <form id="equipo-edicion" onSubmit={guardarEdicion} className="flex flex-col gap-4 px-6 py-5" noValidate>
              <div>
                <label htmlFor="eq-nombre" className={labelClasses}>Nombre</label>
                <input ref={nombreRef} id="eq-nombre" aria-invalid={Boolean(errorDe('name'))} value={form.name} onChange={(e) => actualizarCampo('name', e.target.value)} disabled={guardando} className={inputClasses} />
                {errorDe('name') && <p className={errorCampo}>{errorDe('name')}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="eq-modelo" className={labelClasses}>Modelo</label>
                  <input id="eq-modelo" aria-invalid={Boolean(errorDe('model'))} value={form.model} onChange={(e) => actualizarCampo('model', e.target.value)} disabled={guardando} className={inputClasses} />
                  {errorDe('model') && <p className={errorCampo}>{errorDe('model')}</p>}
                </div>
                <div>
                  <label htmlFor="eq-marca" className={labelClasses}>Marca</label>
                  <select
                    id="eq-marca"
                    aria-invalid={Boolean(errorDe('brand_id'))}
                    value={form.brand_id}
                    onChange={(e) => actualizarCampo('brand_id', e.target.value)}
                    disabled={guardando || marcas === null}
                    className={`${inputClasses} pr-9`}
                  >
                    <option value="">{marcas === null ? 'Cargando marcas…' : 'Selecciona una marca'}</option>
                    {(marcas || []).map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  {errorDe('brand_id') && <p className={errorCampo}>{errorDe('brand_id')}</p>}
                </div>
                <div>
                  <label htmlFor="eq-serie" className={labelClasses}>Serie</label>
                  <input id="eq-serie" aria-invalid={Boolean(errorDe('serie'))} value={form.serie} onChange={(e) => actualizarCampo('serie', e.target.value)} disabled={guardando} className={`${inputClasses} font-mono tracking-[0.04em]`} />
                  {errorDe('serie') && <p className={errorCampo}>{errorDe('serie')}</p>}
                </div>
                <div>
                  <label htmlFor="eq-tipo" className={labelClasses}>Tipo</label>
                  <select id="eq-tipo" aria-invalid={Boolean(errorDe('type'))} value={form.type} onChange={(e) => actualizarCampo('type', e.target.value)} disabled={guardando} className={`${inputClasses} pr-9`}>
                    <option value="">Selecciona un tipo</option>
                    {TIPOS_EQUIPO.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {errorDe('type') && <p className={errorCampo}>{errorDe('type')}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['original', '¿Es original?'],
                  ['is_used', '¿Está usado?'],
                ].map(([campo, etiqueta]) => (
                  <div key={campo} role="group" aria-label={etiqueta}>
                    <p className={labelClasses}>{etiqueta}</p>
                    <div className="flex gap-2">
                      {[
                        [true, 'Sí'],
                        [false, 'No'],
                      ].map(([valor, texto]) => {
                        const puesto = form[campo] === valor
                        return (
                          <button
                            key={texto}
                            type="button"
                            onClick={() => actualizarCampo(campo, valor)}
                            aria-pressed={puesto}
                            disabled={guardando}
                            className={[
                              'inline-flex h-10 flex-1 items-center justify-center rounded-boton border font-body-md text-body-md font-medium transition duration-fast ease-standard active:scale-[0.97] disabled:opacity-60',
                              puesto
                                ? 'border-transparent bg-tinta text-white'
                                : 'border-outline-variant bg-white text-on-surface hover:bg-surface-container',
                            ].join(' ')}
                          >
                            {texto}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-meta leading-4 text-on-surface-subtle">Las características se editan en Catálogo → Equipos.</p>
              {errorGeneral && (
                <p role="alert" className="rounded-boton border border-error/30 bg-error-container/40 px-3 py-2 font-label-sm text-label-sm text-error">
                  {errorGeneral}
                </p>
              )}
            </form>
          ) : (
            equipo && (
              <>
                {/* La serie es lo que se confronta contra la etiqueta física
                    del aparato, así que se le da el lugar de la placa: mono,
                    grande, en su propia franja. */}
                <div className="mx-6 mt-5 rounded-xl bg-surface-container-high px-4 py-3">
                  <p className="mb-1 font-mono text-micro uppercase leading-4 tracking-[0.1em] text-on-surface-variant">
                    Serie
                  </p>
                  <p className="break-all font-mono text-headline-md font-medium uppercase tracking-[0.06em] text-on-surface">
                    {equipo.serie || '—'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 border-b border-outline-variant px-6 py-4">
                  {dato('Tipo', etiquetaTipoEquipo(equipo.type))}
                  {dato('Original', equipo.original ? 'Sí' : 'No')}
                  {dato('Usado', equipo.is_used ? 'Sí' : 'No')}
                </div>

                <div className="px-6 py-4">
                  <p className="mb-2 font-mono text-micro uppercase leading-4 tracking-[0.1em] text-on-surface-variant">
                    {caracteristicas.length > 0 ? `Características (${caracteristicas.length})` : 'Características'}
                  </p>
                  {caracteristicas.length === 0 ? (
                    <p className="font-body-md text-body-md text-on-surface-variant">No tiene características.</p>
                  ) : (
                    <ul className="flex flex-col divide-y divide-outline-variant">
                      {caracteristicas.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 py-2">
                          <span className="font-body-md text-body-md font-semibold text-on-surface">{c.name}:</span>
                          <span className="break-words font-body-md text-body-md text-on-surface-variant">
                            {c.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-outline-variant px-6 py-4">
          {/* key distinta en cada modo: si React reutilizara el mismo botón,
              el segundo Enter sobre "Editar" caería en "Cancelar". */}
          {editando ? (
            <Fragment key="pie-edicion">
              <button
                type="button"
                onClick={() => setEditando(false)}
                disabled={guardando}
                className="inline-flex h-10 items-center justify-center rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container disabled:opacity-60 active:scale-[0.97]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="equipo-edicion"
                disabled={!completo || guardando}
                aria-busy={guardando}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover disabled:opacity-50 active:scale-[0.97]"
              >
                {guardando && <IsotipoCarga className="h-3" />}
                Guardar cambios
              </button>
            </Fragment>
          ) : (
            <Fragment key="pie-ficha">
              {puedeEditar && equipo && !cargando && !error && (
                <button
                  ref={editarRef}
                  type="button"
                  onClick={empezarEdicion}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.75} />
                  Editar
                </button>
              )}
              <button
                type="button"
                onClick={onCerrar}
                className="inline-flex h-10 items-center justify-center rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
              >
                Cerrar
              </button>
            </Fragment>
          )}
        </div>
      </div>
      <IndicadorGuardando activo={guardando} />
    </div>,
    document.body,
  )
}

export default EquipoDetalleModal
