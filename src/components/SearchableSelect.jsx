import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronDown, X, Check } from 'lucide-react'

/**
 * Selector con búsqueda (combobox) para cualquier campo que jale opciones de
 * otra tabla del catálogo -- Marca en Equipos, Departamento en Empleados, y
 * cualquier relación futura similar. Regla general del catálogo: nunca un
 * <select> plano para listas que puedan crecer.
 *
 * - Escritorio: panel flotante debajo del campo, buscador arriba + lista
 *   debajo, mismo borde/radio/sombra que el resto de inputs del sistema.
 * - Celular: el mismo panel pasa a hoja completa (fixed inset-0) para que
 *   buscar y tocar la opción sea cómodo con el dedo.
 * - Sin resultados: mensaje "No se encontraron coincidencias" en vez de
 *   dejar la lista vacía sin explicación.
 *
 * options: [{ id, name }]  ·  value: id seleccionado (o '')  ·  onChange(id)
 */
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  disabled = false,
  emptyOptionsText = 'No hay opciones registradas todavía.',
  helpText,
  // Punto en el que el panel deja de ser hoja completa (móvil) y pasa a
  // desplegable bajo el campo (escritorio). Por defecto 'sm' (640px), igual
  // que siempre. Un caller puede pedir 'md' (768px) para que coincida con su
  // propio punto de quiebre móvil/escritorio -- hoy solo lo usa el buscador
  // de equipo en Entrega de Equipo (ver FormatoActa.jsx), el resto del
  // sistema sigue exactamente igual que antes.
  mobileSheetBreakpoint = 'sm',
}) {
  const usarMd = mobileSheetBreakpoint === 'md'
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [coords, setCoords] = useState(null)
  // Hoja móvil: monta antes de animar la entrada y espera a que termine la
  // transición de salida antes de desmontar (mismo patrón que ConfirmDialog),
  // en vez de aparecer y desaparecer de golpe como antes. El panel de
  // escritorio no se toca -- sigue igual que siempre.
  const [mostrarMobil, setMostrarMobil] = useState(false)
  const [visibleMobil, setVisibleMobil] = useState(false)
  const raiz = useRef(null)
  const boton = useRef(null)
  const panel = useRef(null)
  const inputBusqueda = useRef(null)

  const seleccionado = options.find((o) => String(o.id) === String(value))

  useEffect(() => {
    if (!abierto) return
    function onClick(e) {
      if (raiz.current && raiz.current.contains(e.target)) return
      if (panel.current && panel.current.contains(e.target)) return
      setAbierto(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [abierto])

  useEffect(() => {
    if (abierto) {
      setBusqueda('')
      setTimeout(() => inputBusqueda.current?.focus(), 0)
    }
  }, [abierto])

  useEffect(() => {
    if (abierto) {
      setMostrarMobil(true)
      // El botón que se tocó queda visible en pantalla mientras la hoja está
      // abierta -- sin esto, en un formulario largo el campo podía quedar
      // scrolleado fuera de vista mientras la hoja (anclada abajo) se veía
      // sin relación aparente con lo que se tocó.
      boton.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      // Dos rAF anidados: uno solo no basta, porque puede caer en el mismo
      // frame en el que el navegador todavía no pintó el estado inicial
      // (opacity-0), y entonces la transición se pierde y la hoja aparece de
      // golpe en vez de animar.
      let frame2
      const frame1 = requestAnimationFrame(() => {
        frame2 = requestAnimationFrame(() => setVisibleMobil(true))
      })
      return () => {
        cancelAnimationFrame(frame1)
        if (frame2) cancelAnimationFrame(frame2)
      }
    }
    setVisibleMobil(false)
    const t = setTimeout(() => setMostrarMobil(false), 150)
    return () => clearTimeout(t)
  }, [abierto])

  // El panel de escritorio se dibuja en un portal (document.body), fuera de
  // cualquier contenedor con scroll/overflow que lo recorte (p. ej. la tabla
  // de Entrega de Equipo, que necesita overflow-x: auto y por regla del CSS
  // eso también activa overflow-y). Aquí calculamos su posición "fixed" a
  // partir del botón disparador, y la recalculamos si cambia el tamaño de la
  // ventana o si algún ancestro hace scroll (capture:true para enterarnos de
  // scrolls de contenedores internos, no solo el de la ventana).
  useEffect(() => {
    if (!abierto) return
    function calcular() {
      if (!boton.current) return
      const r = boton.current.getBoundingClientRect()
      setCoords({ top: r.bottom + 6, left: r.left, width: r.width })
    }
    calcular()
    window.addEventListener('resize', calcular)
    window.addEventListener('scroll', calcular, true)
    return () => {
      window.removeEventListener('resize', calcular)
      window.removeEventListener('scroll', calcular, true)
    }
  }, [abierto])

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.name.toLowerCase().includes(q))
  }, [options, busqueda])

  function elegir(opcion) {
    onChange(String(opcion.id))
    setAbierto(false)
  }

  // Contenido compartido (buscador + lista) entre la hoja móvil y el panel
  // de escritorio -- solo cambia el contenedor que lo envuelve.
  const contenido = (
    <>
      <div className={`flex items-center gap-2 border-b border-outline-variant p-2.5 ${usarMd ? 'md:p-2' : 'sm:p-2'}`}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" strokeWidth={2} />
          <input
            ref={inputBusqueda}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar..."
            className="h-10 w-full rounded-lg border border-outline-variant bg-surface pl-9 pr-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform ${usarMd ? 'md:hidden' : 'sm:hidden'}`}
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        {options.length === 0 ? (
          <p className="px-3 py-6 text-center font-body-md text-body-md text-on-surface-variant">
            {emptyOptionsText}
          </p>
        ) : filtradas.length === 0 ? (
          <p className="px-3 py-6 text-center font-body-md text-body-md text-on-surface-variant">
            No se encontraron coincidencias.
          </p>
        ) : (
          filtradas.map((opcion) => {
            const activo = String(opcion.id) === String(value)
            return (
              <button
                key={opcion.id}
                type="button"
                onClick={() => elegir(opcion)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors active:scale-[0.97] transition-transform ${
                  activo ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface'
                }`}
              >
                <span className="truncate">{opcion.name}</span>
                {activo && <Check className="h-4 w-4 shrink-0" strokeWidth={2.25} />}
              </button>
            )
          })
        )}
      </div>
    </>
  )

  return (
    <div ref={raiz} className="relative">
      <button
        ref={boton}
        type="button"
        disabled={disabled}
        onClick={() => setAbierto((v) => !v)}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3.5 font-body-md text-body-md text-on-surface transition-colors hover:border-outline focus:outline-none disabled:opacity-60 active:scale-[0.97] transition-transform ${
          abierto ? 'border-primary ring-2 ring-primary/25' : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/25'
        }`}
      >
        <span className={seleccionado ? 'truncate text-on-surface' : 'truncate text-on-surface-variant'}>
          {seleccionado ? seleccionado.name : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-on-surface-variant" strokeWidth={2} />
      </button>

      {helpText && <p className="mt-1.5 font-label-sm text-label-sm text-on-surface-variant">{helpText}</p>}

      {mostrarMobil &&
        createPortal(
          // Móvil: mismo patrón de ventana centrada que ConfirmDialog (fondo
          // oscuro + tarjeta centrada, con la misma animación de
          // opacidad+escala), en vez de una hoja pegada abajo -- así elegir un
          // equipo/colaborador se siente igual que cualquier otra ventana
          // emergente del sistema, no como una alerta aparte. Portal a
          // document.body por la misma razón que ConfirmDialog: un ancestro
          // con animate-view-in crea su propio contexto de apilamiento y
          // puede atrapar un position:fixed dentro de él.
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 transition-opacity duration-200 ${
              visibleMobil ? 'opacity-100' : 'opacity-0'
            } ${usarMd ? 'md:hidden' : 'sm:hidden'}`}
            onClick={() => setAbierto(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg transition-all duration-200 ease-out ${
                visibleMobil ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
              }`}
            >
              {contenido}
            </div>
          </div>,
          document.body,
        )}

      {/* Escritorio: portal a document.body, posición fixed calculada desde
          el botón. Así nunca lo recorta un contenedor con scroll (p. ej. la
          tabla de Entrega de Equipo), a diferencia de la versión anterior que
          usaba md:absolute dentro de la propia fila. Sigue igual que siempre. */}
      {abierto &&
        coords &&
        createPortal(
          <div
            ref={panel}
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
            className={
              usarMd
                ? 'animate-view-in z-30 hidden max-h-72 flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-lg md:flex'
                : 'animate-view-in z-30 hidden max-h-72 flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-lg sm:flex'
            }
          >
            {contenido}
          </div>,
          document.body,
        )}
    </div>
  )
}

export default SearchableSelect
