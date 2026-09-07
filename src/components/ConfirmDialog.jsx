import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Diálogo de confirmación ligero, mismo lenguaje que .dialog del sistema
 * (fondo con blur, tarjeta centrada, título + acciones) -- no una alerta
 * genérica del navegador. Se usa antes de abrir la edición de un empleado
 * desde la tarjeta móvil, para evitar ediciones accidentales.
 *
 * Dos variantes:
 *   - 'normal'  (por defecto) → idéntico a como se veía antes: botón de
 *     confirmar en bg-primary. Las llamadas existentes no cambian en nada.
 *   - 'peligro' → para acciones que NO se pueden deshacer (eliminar). Añade la
 *     insignia de advertencia y pinta el botón de confirmar con el rojo que la
 *     paleta del sistema ya reserva para errores y borrado.
 *
 * En 'peligro' el foco arranca en Cancelar, no en Confirmar: si el usuario
 * llega con el Enter apretado, no borra por inercia.
 */
function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Sí, continuar',
  textoCancelar = 'Cancelar',
  variante = 'normal',
  onConfirmar,
  onCancelar,
}) {
  const cancelarRef = useRef(null)
  const peligro = variante === 'peligro'

  useEffect(() => {
    if (!abierto) return
    function onKey(e) {
      if (e.key === 'Escape') onCancelar?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [abierto, onCancelar])

  // El foco entra al diálogo al abrirse: sin esto el teclado se queda en el
  // botón que lo disparó, detrás del fondo oscuro.
  useEffect(() => {
    if (!abierto) return
    const t = setTimeout(() => cancelarRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [abierto])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4"
      onClick={() => onCancelar?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titulo ? 'confirm-dialog-titulo' : undefined}
        onClick={(e) => e.stopPropagation()}
        className="animate-view-in w-full max-w-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-lg"
      >
        <div className={peligro ? 'flex items-start gap-3.5' : undefined}>
          {peligro && (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-error-container text-on-error-container">
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {titulo && (
              <h2
                id="confirm-dialog-titulo"
                className="mb-1.5 font-headline-md text-headline-md font-bold text-on-surface"
              >
                {titulo}
              </h2>
            )}
            <p className="font-body-md text-body-md text-on-surface-variant break-words">{mensaje}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            ref={cancelarRef}
            type="button"
            onClick={onCancelar}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className={[
              'inline-flex h-10 items-center justify-center rounded-lg px-4 font-label-bold text-label-bold shadow-sm transition-all hover:brightness-110 active:brightness-95',
              peligro ? 'bg-error text-on-error' : 'bg-primary text-on-primary',
            ].join(' ')}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
