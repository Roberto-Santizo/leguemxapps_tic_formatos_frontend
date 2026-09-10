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
        className="h-8 rounded-md border border-outline-variant bg-surface px-2 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
      />
    )
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={abrir}
        title={title || 'Clic para corregir la fecha (solo en este navegador)'}
        className="group inline-flex items-center gap-1 text-left hover:text-secondary transition-colors active:scale-[0.97] transition-transform"
      >
        <span>{formatearFecha(value)}</span>
        <Pencil className="h-3 w-3 opacity-40 group-hover:opacity-70 transition-opacity" strokeWidth={2.25} />
      </button>
      {corregida && (
        <>
          <span
            title="Este ajuste solo se ve en este navegador -- no cambia el registro real del servidor"
            className="rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-label-sm text-on-secondary-container"
          >
            Corregida aquí
          </span>
          <button
            type="button"
            onClick={onRestablecer}
            title="Restablecer a la fecha original del sistema"
            aria-label="Restablecer fecha original"
            className="grid h-6 w-6 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high active:scale-[0.90] transition-transform"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </>
      )}
    </div>
  )
}

export default EditorFechaLocal
