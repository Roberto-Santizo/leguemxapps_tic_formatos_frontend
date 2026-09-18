import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronDown, X, Check, Eye } from 'lucide-react'

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
 * options: [{ id, name, codigo? }]  ·  value: id seleccionado (o '')  ·  onChange(id)
 *
 * `codigo` es opcional y sirve para listas donde varias opciones comparten el
 * mismo nombre y solo las distingue un identificador (la serie de un equipo:
 * diez "Dell Latitude" iguales en el catálogo). Cuando viene:
 * - La fila de la lista va a dos líneas: nombre arriba, código en mono abajo,
 *   sin truncar, para leerlo contra la etiqueta física.
 * - En el campo con opción elegida el código queda siempre completo a la
 *   derecha (shrink-0); lo que se trunca es el nombre.
 * - El buscador también filtra por código, ignorando mayúsculas, espacios,
 *   guiones y puntos (teclear los últimos 4-5 caracteres del sticker basta).
 * - Enter con una sola coincidencia la elige (ahorra el clic final; sirve
 *   también con un lector de código de barras, que teclea + Enter).
 * Sin `codigo` todo se pinta y se busca exactamente igual que siempre (salvo
 * que la búsqueda ahora ignora espacios/guiones, mejora inofensiva).
 */

// Minúsculas y sin espacios, guiones, puntos ni guiones bajos: así la serie
// "ABC-123 45" y la búsqueda "abc12345" coinciden.
function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .replace(/[\s\-_.]/g, '')
}
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
  // Opcional. Si viene, cada opción de la lista lleva un ojo a la derecha
  // que llama `onVerDetalle(id)` SIN elegirla ni cerrar la lista: sirve para
  // revisar el equipo mientras se navega, antes de decidirse. Además, con una
  // opción ya elegida, el mismo ojo aparece dentro del campo (a la izquierda
  // de la flecha) para volver a verla sin abrir la lista. Hoy solo lo usa el
  // buscador de equipo en Entrega de Equipo (EquipoDetalleModal). En ambos
  // sitios el ojo es un hermano del botón, no un hijo: un <button> no puede
  // ir dentro de otro <button>.
  onVerDetalle,
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
  const mostrarOjo = Boolean(onVerDetalle && seleccionado && !disabled)

  useEffect(() => {
    if (!abierto) return
    // Si hay una ventana modal encima (la ficha del equipo que abre el ojo
    // de una opción), los clics y el Escape son para ella: la lista se queda
    // abierta para seguir navegando al cerrarla.
    function hayModalEncima() {
      return Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'))
    }
    function onClick(e) {
      if (raiz.current && raiz.current.contains(e.target)) return
      if (panel.current && panel.current.contains(e.target)) return
      if (hayModalEncima()) return
      setAbierto(false)
    }
    function onKey(e) {
      if (e.key === 'Escape' && !hayModalEncima()) setAbierto(false)
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
    const q = normalizar(busqueda)
    if (!q) return options
    return options.filter((o) => normalizar(o.name).includes(q) || normalizar(o.codigo).includes(q))
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtradas.length === 1) {
                e.preventDefault()
                elegir(filtradas[0])
              }
            }}
            placeholder="Buscar..."
            className="h-10 w-full rounded-lg border border-outline-variant bg-surface pl-9 pr-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high active:scale-[0.90] transition-transform ${usarMd ? 'md:hidden' : 'sm:hidden'}`}
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
            const fila = (
              <button
                key={opcion.id}
                type="button"
                onClick={() => elegir(opcion)}
                className={`flex w-full min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors active:scale-[0.97] transition-transform ${
                  activo ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface'
                }`}
              >
                {opcion.codigo ? (
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{opcion.name}</span>
                    <span className="break-all font-mono text-label-sm uppercase tracking-wide">{opcion.codigo}</span>
                  </span>
                ) : (
                  <span className="truncate">{opcion.name}</span>
                )}
                {activo && <Check className="h-4 w-4 shrink-0" strokeWidth={2.25} />}
              </button>
            )
            if (!onVerDetalle) return fila
            return (
              <div key={opcion.id} className="flex items-center gap-1">
                {fila}
                <button
                  type="button"
                  onClick={() => onVerDetalle(String(opcion.id))}
                  aria-label={`Ver detalle de ${[opcion.name, opcion.codigo].filter(Boolean).join(' ')}`}
                  title="Ver detalle del equipo"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 active:scale-[0.90] transition-transform"
                >
                  <Eye className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
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
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-surface pl-3.5 font-body-md text-body-md text-on-surface transition-colors hover:border-outline focus:outline-none disabled:opacity-60 active:scale-[0.97] transition-transform ${
          mostrarOjo ? 'pr-[4.25rem]' : 'pr-3.5'
        } ${
          abierto ? 'border-primary ring-2 ring-primary/25' : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/25'
        }`}
      >
        <span className={seleccionado ? 'truncate text-on-surface' : 'truncate text-on-surface-variant'}>
          {seleccionado ? seleccionado.name : placeholder}
        </span>
        {seleccionado?.codigo && (
          <span className="ml-auto shrink-0 font-mono text-label-sm uppercase tracking-wide text-on-surface">
            {seleccionado.codigo}
          </span>
        )}
        {!mostrarOjo && <ChevronDown className="h-4 w-4 shrink-0 text-on-surface-variant" strokeWidth={2} />}
      </button>

      {/* Ojo + flecha superpuestos al campo (position absolute sobre la caja
          relative de arriba, con alto fijo h-11 para no depender del helpText
          de abajo). La flecha se vuelve a pintar aquí para que quede a la
          derecha del ojo y con la misma separación que tenía sola. */}
      {mostrarOjo && (
        <div className="pointer-events-none absolute right-0 top-0 flex h-11 items-center gap-1 pr-3.5">
          <button
            type="button"
            onClick={() => {
              setAbierto(false)
              onVerDetalle(String(seleccionado.id))
            }}
            aria-label={`Ver detalle de ${[seleccionado.name, seleccionado.codigo].filter(Boolean).join(' ')}`}
            title="Ver detalle del equipo"
            className="pointer-events-auto grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 active:scale-[0.90] transition-transform"
          >
            <Eye className="h-4 w-4" strokeWidth={2} />
          </button>
          <ChevronDown className="h-4 w-4 shrink-0 text-on-surface-variant" strokeWidth={2} />
        </div>
      )}

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
