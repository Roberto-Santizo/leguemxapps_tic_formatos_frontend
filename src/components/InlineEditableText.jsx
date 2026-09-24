import { useEffect, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'

/**
 * Texto que se ve como texto normal, pero al hacer clic se convierte
 * en un campo editable del mismo tamaño/estilo (sin recuadro de input).
 * Guarda con Enter o al perder el foco; Escape cancela.
 *
 * Por defecto no deja guardar el texto vacío: si se borra todo, al guardar
 * vuelve el valor anterior (así debe ser en la vigencia del membrete o en el
 * nombre de una característica, que no pueden quedar en blanco).
 * `permitirVacio` cambia eso para los campos que SÍ pueden quedar vacíos --
 * hoy, las observaciones del historial --: el vacío llega a `onChange` como
 * '' y `placeholder` es lo que se ve mientras no hay texto.
 */
function InlineEditableText({
  value,
  onChange,
  className = '',
  inputClassName = '',
  title,
  permitirVacio = false,
  placeholder = '',
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    setDraft(value ?? '')
  }, [value])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    const sinCambios = trimmed === (value ?? '').trim()
    if (sinCambios || (!trimmed && !permitirVacio)) {
      setDraft(value ?? '')
      return
    }
    onChange(trimmed)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    }
    if (event.key === 'Escape') {
      setDraft(value ?? '')
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`bg-transparent border-0 border-b border-on-surface rounded-none focus:outline-none focus:ring-0 p-0 ${inputClassName}`}
        style={{ width: `${Math.max(draft.length, placeholder.length, 4)}ch` }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={title || 'Clic para editar'}
      className={`group inline-flex items-center gap-1 rounded-sm text-left underline-offset-4 decoration-outline-variant transition duration-fast ease-standard hover:underline hover:decoration-outline active:scale-[0.97] cursor-text focus:outline-none focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2 ${className}`}
    >
      <span>{value || placeholder}</span>
      {/* Antes solo aparecía con group-hover, así que en celular (sin hover)
          nunca se veía ningún indicio de que el texto es editable. Ahora
          queda siempre visible a baja opacidad -- funciona como affordance
          permanente en táctil -- y sube de opacidad al pasar el mouse en
          escritorio. */}
      <Pencil
        className="h-3 w-3 shrink-0 opacity-40 transition-opacity duration-fast group-hover:opacity-80"
        strokeWidth={2}
      />
    </button>
  )
}

export default InlineEditableText
