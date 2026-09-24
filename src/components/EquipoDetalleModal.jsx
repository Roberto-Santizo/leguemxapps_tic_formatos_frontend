import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { obtenerEquipo, obtenerMarca, obtenerCaracteristicasDeEquipo } from '../services/api.js'
import { etiquetaTipoEquipo } from '../pages/EquipoForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Ficha del equipo en ventana emergente. La abre el ojo del buscador de
 * equipo en Entrega de Equipo (FormatoActa → SearchableSelect
 * `onVerDetalle`) para revisar modelo, serie y características ANTES de
 * dejarlo en el acta, sin salir del formulario a mitad de llenado.
 *
 * Es una vista de solo lectura: nunca edita ni sustituye a Catálogo →
 * Equipos → Ver, que sigue siendo la página completa (con historial y botón
 * de editar). Por eso tampoco carga el historial de asignaciones: lo que se
 * elige aquí siempre es un equipo disponible.
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
 */
function EquipoDetalleModal({ equipoId, onCerrar }) {
  const { token } = useAuth()
  const abierto = Boolean(equipoId)
  const cajaRef = useRef(null)
  const cerrarRef = useRef(null)

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

  useEffect(() => {
    if (!abierto) return
    function onKey(e) {
      if (e.key === 'Escape') onCerrar?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [abierto, onCerrar])

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
      onClick={onCerrar}
    >
      <div
        ref={cajaRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="equipo-detalle-titulo"
        onClick={(e) => e.stopPropagation()}
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
              Ficha del equipo
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
                  className="break-words font-headline-md text-[20px] font-semibold leading-7 tracking-[-0.02em] text-on-surface"
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
            onClick={onCerrar}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-boton text-on-surface-variant transition duration-fast ease-standard hover:bg-surface-container hover:text-on-surface active:scale-[0.90]"
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

        <div className="flex justify-end border-t border-outline-variant px-6 py-4">
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex h-10 items-center justify-center rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default EquipoDetalleModal
