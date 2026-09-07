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
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high ${usarMd ? 'md:hidden' : 'sm:hidden'}`}
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
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors hover:bg-surface-container-high ${
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
        className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-outline-variant bg-surface px-3.5 font-body-md text-body-md text-on-surface transition-colors hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
      >
        <span className={seleccionado ? 'truncate text-on-surface' : 'truncate text-on-surface-variant'}>
          {seleccionado ? seleccionado.name : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-on-surface-variant" strokeWidth={2} />
      </button>

      {helpText && <p className="mt-1.5 font-label-sm text-label-sm text-on-surface-variant">{helpText}</p>}

      {abierto && (
        <>
          {/* Fondo solo en móvil, para leer el panel como hoja completa */}
          <div
            className={
              usarMd
                ? 'fixed inset-0 z-40 bg-on-surface/30 md:hidden'
                : 'fixed inset-0 z-40 bg-on-surface/30 sm:hidden'
            }
            onClick={() => setAbierto(false)}
          />

          {/* Móvil: hoja completa, igual que siempre, sin tocar nada aquí. */}
          <div
            className={
              usarMd
                ? 'animate-view-in fixed inset-x-4 top-16 bottom-4 z-50 flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-lg md:hidden'
                : 'animate-view-in fixed inset-x-4 top-16 bottom-4 z-50 flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-lg sm:hidden'
            }
          >
            {contenido}
          </div>

          {/* Escritorio: portal a document.body, posición fixed calculada
              desde el botón. Así nunca lo recorta un contenedor con scroll
              (p. ej. la tabla de Entrega de Equipo), a diferencia de la
              versión anterior que usaba md:absolute dentro de la propia fila. */}
          {coords &&
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
        </>
      )}
    </div>
  )
}

export default SearchableSelect
