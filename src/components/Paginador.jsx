import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TAMANO_PAGINA } from '../hooks/usePaginacion.js'

/**
 * Pie de las listas paginadas: "Mostrando 1–20 de 57 marcas" + Anterior /
 * números / Siguiente. Sustituye al párrafo de conteo que tenían las listas
 * (mismo texto label-sm y mismo lugar, debajo de la tabla / las tarjetas).
 *
 *  - Con una sola página solo se muestra el conteo, sin botones: no hay a
 *    dónde ir.
 *  - Los números se recortan con "…" alrededor de la página actual para que
 *    no crezcan sin límite; en móvil (< sm) se ocultan y queda
 *    "Página 2 de 5" entre las dos flechas.
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
  if (!total) return null

  const desde = (pagina - 1) * tamano + 1
  const hasta = Math.min(pagina * tamano, total)
  const unaSola = ultimaPagina <= 1

  const conteo = unaSola ? `${total} ${plural}` : `Mostrando ${desde}–${hasta} de ${total} ${plural}`

  const flecha =
    'inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:bg-surface disabled:active:scale-100'
  const numero =
    'inline-grid h-10 min-w-10 place-items-center rounded-lg px-2 font-label-bold text-label-bold tabular-nums transition-colors active:scale-[0.97] transition-transform'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">{conteo}</p>

      {!unaSola && (
        <nav aria-label="Paginación" className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCambiar(pagina - 1)}
            disabled={pagina <= 1}
            aria-label="Página anterior"
            className={flecha}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <span className="sm:hidden px-2 font-label-sm text-label-sm text-on-surface-variant tabular-nums">
            Página {pagina} de {ultimaPagina}
          </span>

          <div className="hidden sm:flex items-center gap-1">
            {paginasVisibles(pagina, ultimaPagina).map((n, i) =>
              n === null ? (
                <span
                  key={`hueco-${i}`}
                  className="inline-grid h-10 w-8 place-items-center font-label-sm text-label-sm text-on-surface-variant"
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
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
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
            disabled={pagina >= ultimaPagina}
            aria-label="Página siguiente"
            className={flecha}
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </nav>
      )}
    </div>
  )
}

export default Paginador
