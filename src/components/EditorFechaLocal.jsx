import { useState } from 'react'
import { Pencil, RotateCcw } from 'lucide-react'
import { formatearFecha, fechaInputValue } from '../utils/fecha.js'

/**
 * Fecha con corrección LOCAL (ver useFechaLocal.js): se ve y se edita igual
 * que InlineEditableText, pero abre un <input type="date"> nativo y NO
 * llama a ninguna API -- el estado (valor, si está corregida) vive en el
 * componente padre vía useFechaLocal, este componente solo lo dibuja.
 */
function EditorFechaLocal({ value, corregida, onChange, onRestablecer, title }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => fechaInputValue(value))

  function abrir() {
    setDraft(fechaInputValue(value))
    setEditing(true)
  }

  function commit() {
    if (draft) onChange(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') setEditing(false)
        }}
        className="h-8 rounded-boton border border-on-surface bg-white px-2 font-body-md text-body-md text-on-surface focus:border-on-surface focus:outline-none focus:ring-0"
      />
    )
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={abrir}
        title={title || 'Clic para corregir la fecha (solo en este navegador)'}
        className="group inline-flex items-center gap-1 rounded-sm text-left underline-offset-4 decoration-outline-variant transition duration-fast ease-standard hover:underline hover:decoration-outline active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2"
      >
        <span>{formatearFecha(value)}</span>
        <Pencil className="h-3 w-3 shrink-0 opacity-40 transition-opacity duration-fast group-hover:opacity-80" strokeWidth={2} />
      </button>
      {corregida && (
        <>
          <span
            title="Este ajuste solo se ve en este navegador -- no cambia el registro real del servidor"
            className="inline-flex h-5 animate-badge-pop items-center gap-1 rounded-full border border-outline-variant bg-white px-2 font-mono text-[10px] uppercase tracking-[0.08em] text-on-surface-variant"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-assigned" />
            Corregida aquí
          </span>
          <button
            type="button"
            onClick={onRestablecer}
            title="Restablecer a la fecha original del sistema"
            aria-label="Restablecer fecha original"
            className="grid h-6 w-6 place-items-center rounded-boton text-on-surface-variant transition duration-fast ease-standard hover:bg-surface-container hover:text-on-surface active:scale-[0.90]"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </>
      )}
    </div>
  )
}

export default EditorFechaLocal
