import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TAMANO_PAGINA } from '../hooks/usePaginacion.js'

/**
 * Pie de las listas paginadas: "Mostrando 1–20 de 57 marcas · Página 1 de 3"
 * + Anterior / números / Siguiente. Va SIEMPRE debajo de la tabla / las
 * tarjetas y SIEMPRE se muestra (también con una sola página o sin
 * registros), para que el usuario sepa en qué página está y cuántas hay;
 * cuando no hay a dónde ir, las flechas quedan deshabilitadas.
 *
 *  - Los números se recortan con "…" alrededor de la página actual para que
 *    no crezcan sin límite; en móvil (< sm) se ocultan y queda
 *    "Página 2 de 5" entre las dos flechas.
 *  - `tamano` es el `limit` con el que se pidió la página (viene de la URL,
 *    ver usePaginaUrl); sirve para calcular el rango "desde–hasta".
 *
 * `onCambiar(n)` recibe la página destino; quien lo usa decide cómo
 * guardarla (en este sistema, en la URL -- ver usePaginaUrl).
 */

// Páginas a pintar: siempre la primera, la última y las vecinas de la
// actual; los huecos se marcan con null (→ "…").
function paginasVisibles(actual, ultima) {
  if (ultima <= 7) return Array.from({ length: ultima }, (_, i) => i + 1)
  const conjunto = new Set([1, ultima, actual - 1, actual, actual + 1])
  if (actual <= 3) [2, 3, 4].forEach((n) => conjunto.add(n))
  if (actual >= ultima - 2) [ultima - 3, ultima - 2, ultima - 1].forEach((n) => conjunto.add(n))
  const ordenadas = [...conjunto].filter((n) => n >= 1 && n <= ultima).sort((a, b) => a - b)
  const salida = []
  ordenadas.forEach((n, i) => {
    if (i > 0 && n - ordenadas[i - 1] > 1) salida.push(null)
    salida.push(n)
  })
  return salida
}

function Paginador({ pagina, ultimaPagina, total, plural, tamano = TAMANO_PAGINA, onCambiar }) {
  const desde = total ? (pagina - 1) * tamano + 1 : 0
  const hasta = Math.min(pagina * tamano, total)
  const ultima = Math.max(1, ultimaPagina)

  const conteo = !total
    ? `0 ${plural}`
    : total <= tamano
      ? `${total} ${plural}`
      : `Mostrando ${desde}–${hasta} de ${total} ${plural}`

  // Sistema "Sierra": pie como el de la tabla del mockup -- franja gris con el
  // conteo en mono ("MOSTRANDO 1–10 DE 26") a la izquierda y los botones
  // secundarios "‹ Anterior" / "Siguiente ›" a la derecha. Es una tarjeta
  // propia porque las pantallas lo ponen debajo de la tabla/las tarjetas y
  // puede caer sobre la cordillera (nunca texto directo sobre la montaña).
  const flecha =
    'inline-flex h-8 items-center justify-center gap-1 rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97] disabled:cursor-not-allowed disabled:text-on-surface-subtle disabled:hover:bg-white disabled:active:scale-100'
  const numero =
    'inline-grid h-8 min-w-8 place-items-center rounded-boton px-2 font-mono text-[12px] tabular-nums transition duration-fast ease-standard active:scale-[0.97]'

  return (
    <div className="flex flex-col gap-3 rounded-tarjeta bg-surface-container px-4 py-3 shadow-tarjeta sm:flex-row sm:items-center sm:justify-between">
      <p className="font-mono text-[11px] uppercase leading-4 tracking-[0.1em] text-on-surface-variant tabular-nums">
        {conteo}
        <span className="hidden sm:inline">
          {' '}
          · Página {pagina} de {ultima}
        </span>
      </p>

      <nav aria-label="Paginación" className="flex w-full items-center gap-1 sm:w-auto">
        <button
          type="button"
          onClick={() => onCambiar(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
          className={flecha}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <span className="sm:hidden flex-1 px-2 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant tabular-nums">
          Página {pagina} de {ultima}
        </span>

        <div className="hidden sm:flex items-center gap-1">
          {paginasVisibles(pagina, ultima).map((n, i) =>
            n === null ? (
              <span
                key={`hueco-${i}`}
                className="inline-grid h-8 w-6 place-items-center font-mono text-[12px] text-on-surface-subtle"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => n !== pagina && onCambiar(n)}
                aria-label={`Página ${n}`}
                aria-current={n === pagina ? 'page' : undefined}
                className={[
                  numero,
                  n === pagina
                    ? 'bg-tinta text-white shadow-sm'
                    : 'text-on-surface-variant hover:bg-white hover:text-on-surface',
                ].join(' ')}
              >
                {n}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => onCambiar(pagina + 1)}
          disabled={pagina >= ultima}
          aria-label="Página siguiente"
          className={flecha}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </nav>
    </div>
  )
}

export default Paginador
