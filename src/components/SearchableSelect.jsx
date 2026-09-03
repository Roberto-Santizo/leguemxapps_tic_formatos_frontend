import { useEffect, useMemo, useRef, useState } from 'react'
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
}) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const raiz = useRef(null)
  const inputBusqueda = useRef(null)

  const seleccionado = options.find((o) => String(o.id) === String(value))

  useEffect(() => {
    if (!abierto) return
    function onClick(e) {
      if (raiz.current && !raiz.current.contains(e.target)) setAbierto(false)
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

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.name.toLowerCase().includes(q))
  }, [options, busqueda])

  function elegir(opcion) {
    onChange(String(opcion.id))
    setAbierto(false)
  }

  return (
    <div ref={raiz} className="relative">
      <button
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
          <div className="fixed inset-0 z-40 bg-on-surface/30 sm:hidden" onClick={() => setAbierto(false)} />

          <div className="animate-view-in fixed inset-x-4 top-16 bottom-4 z-50 flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-lg sm:absolute sm:inset-x-0 sm:bottom-auto sm:top-full sm:z-30 sm:mt-1.5 sm:max-h-72 sm:rounded-lg">
            <div className="flex items-center gap-2 border-b border-outline-variant p-2.5 sm:p-2">
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
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high sm:hidden"
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
          </div>
        </>
      )}
    </div>
  )
}

export default SearchableSelect
