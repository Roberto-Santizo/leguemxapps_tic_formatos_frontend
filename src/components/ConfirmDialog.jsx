import { useEffect } from 'react'

/**
 * Diálogo de confirmación ligero, mismo lenguaje que .dialog del sistema
 * (fondo con blur, tarjeta centrada, título + acciones) -- no una alerta
 * genérica del navegador. Se usa antes de abrir la edición de un empleado
 * desde la tarjeta móvil, para evitar ediciones accidentales.
 */
function ConfirmDialog({ abierto, titulo, mensaje, textoConfirmar = 'Sí, continuar', onConfirmar, onCancelar }) {
  useEffect(() => {
    if (!abierto) return
    function onKey(e) {
      if (e.key === 'Escape') onCancelar()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [abierto, onCancelar])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4">
      <div className="animate-view-in w-full max-w-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-lg">
        {titulo && (
          <h2 className="mb-1.5 font-headline-md text-headline-md font-bold text-on-surface">{titulo}</h2>
        )}
        <p className="font-body-md text-body-md text-on-surface-variant">{mensaje}</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancelar}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
