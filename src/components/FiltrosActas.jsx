import { X } from 'lucide-react'

/**
 * Barra de filtros de las listas de actas (Historial de entrega y de
 * devolución, y su versión por departamento). Solo presentación: el estado
 * vive en la URL de cada lista (usePaginaUrl → parametro / setParametro) y el
 * filtrado lo hace useListaPaginada con `filtroExtra`, en el cliente, porque
 * los filtros del backend para estas listas fallan (ver api.js,
 * listarDocumentosEntrega).
 *
 * Mismos chips que el filtro de estado de Equipos (h-8, redondos, punto de
 * color), para que todos los filtros del sistema se vean igual.
 *
 *  grupos: [{ id, etiqueta, valor, onCambiar, opciones: [{ valor, etiqueta, punto? }] }]
 *  desde / hasta: 'aaaa-mm-dd' o ''  ·  onDesde / onHasta(valor)
 *  hayFiltros: muestra "Limpiar filtros"  ·  onLimpiar()
 */
const etiquetaGrupo = 'font-mono text-micro uppercase tracking-[0.1em] text-on-surface-variant'
const chip =
  'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-meta font-medium leading-4 whitespace-nowrap transition duration-fast ease-standard active:scale-[0.97]'
const inputFecha =
  'h-8 w-[136px] rounded-boton border border-outline-variant bg-white px-2 font-mono text-meta tabular-nums text-on-surface transition hover:[&:not(:focus)]:border-outline'

function FiltrosActas({ grupos, desde, hasta, onDesde, onHasta, hayFiltros, onLimpiar }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {grupos.map((grupo) => (
        <div key={grupo.id} className="flex flex-wrap items-center gap-2" role="group" aria-label={`Filtrar por ${grupo.etiqueta.toLowerCase()}`}>
          <span className={etiquetaGrupo}>{grupo.etiqueta}</span>
          {grupo.opciones.map(({ valor, etiqueta, punto }) => {
            const puesto = grupo.valor === valor
            return (
              <button
                key={valor || 'todos'}
                type="button"
                onClick={() => grupo.onCambiar(valor)}
                aria-pressed={puesto}
                className={[
                  chip,
                  puesto
                    ? 'border-transparent bg-tinta text-white'
                    : 'border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                ].join(' ')}
              >
                {punto && <span className={`h-1.5 w-1.5 rounded-full ${punto}`} aria-hidden="true" />}
                {etiqueta}
              </button>
            )
          })}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por fecha">
        <span className={etiquetaGrupo}>Fecha</span>
        <input
          type="date"
          value={desde}
          max={hasta || undefined}
          onChange={(e) => onDesde(e.target.value)}
          aria-label="Desde"
          title="Desde"
          className={inputFecha}
        />
        <span aria-hidden="true" className="text-meta text-on-surface-variant">–</span>
        <input
          type="date"
          value={hasta}
          min={desde || undefined}
          onChange={(e) => onHasta(e.target.value)}
          aria-label="Hasta"
          title="Hasta"
          className={inputFecha}
        />
      </div>

      {hayFiltros && (
        <button
          type="button"
          onClick={onLimpiar}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-meta font-medium text-on-surface-variant transition duration-fast ease-standard hover:bg-surface-container hover:text-on-surface active:scale-[0.97]"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

export default FiltrosActas
