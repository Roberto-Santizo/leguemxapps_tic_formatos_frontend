import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

/**
 * Único diálogo de confirmación del sistema -- antes existían dos
 * (ConfirmDialog y ConfirmModal) con distinto radio, z-index, animación y
 * política de Escape. ConfirmModal ya no existe: su único uso real (pedir
 * contraseña antes de exportar a Excel, en BotonExcel.jsx) se cubre aquí con
 * `requierePassword`.
 *
 * Variantes:
 *   - 'normal'  (por defecto) → botón de confirmar en bg-primary.
 *   - 'peligro' → para acciones que NO se pueden deshacer (eliminar). Añade la
 *     insignia de advertencia y pinta el botón de confirmar con el rojo que la
 *     paleta del sistema ya reserva para errores y borrado. El foco arranca en
 *     Cancelar, no en Confirmar.
 *
 * `permitirNoPreguntar`: agrega un checkbox "No volver a preguntarme en esta
 * sesión" (hoy lo usan Finalizar Entrega y Finalizar Devolución, que se
 * llenan varias veces seguidas). Si se marca, `onConfirmar` recibe `true`
 * como segundo argumento -- quien llama decide qué hacer con eso (guardarlo
 * en AuthContext, por ejemplo). No afecta a los usos existentes: ese segundo
 * argumento siempre puede ignorarse.
 *
 * Entra y sale con la misma transición corta (150ms, opacidad + escala), en
 * vez de aparecer animado y desaparecer de golpe.
 *
 * Se pinta con un portal a document.body (igual que el panel de escritorio
 * de SearchableSelect) en vez de quedar donde el JSX de cada pantalla lo
 * coloca. Motivo: toda pantalla envuelve su contenido en `animate-view-in`,
 * y una animación que mueve opacity/transform crea su propio contexto de
 * apilamiento en CSS -- sin el portal, este diálogo (aunque sea
 * position:fixed) quedaba atrapado dentro de ese contexto y el Sidebar
 * (que vive fuera, con su propio z-index) podía quedar por encima del fondo
 * oscuro en vez de taparse, e incluso llegar a ocultar el diálogo por
 * completo en algunas pantallas.
 */
function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Sí, continuar',
  textoCancelar = 'Cancelar',
  variante = 'normal',
  requierePassword = false,
  permitirNoPreguntar = false,
  textoNoPreguntar = 'No volver a preguntarme en esta sesión',
  procesando = false,
  error = '',
  onConfirmar,
  onCancelar,
}) {
  const cancelarRef = useRef(null)
  const passwordRef = useRef(null)
  const cajaRef = useRef(null)
  const peligro = variante === 'peligro'

  const [montado, setMontado] = useState(abierto)
  const [visible, setVisible] = useState(false)
  const [password, setPassword] = useState('')
  const [errorLocal, setErrorLocal] = useState('')
  const [noPreguntar, setNoPreguntar] = useState(false)

  // Monta antes de animar la entrada, y espera a que termine la transición de
  // salida antes de desmontar -- así el cierre también se ve, no solo se corta.
  useEffect(() => {
    if (abierto) {
      setMontado(true)
      setPassword('')
      setErrorLocal('')
      setNoPreguntar(false)
      return
    }
    setVisible(false)
    const t = setTimeout(() => setMontado(false), 200)
    return () => clearTimeout(t)
  }, [abierto])

  // Dispara la animación de entrada una vez que el diálogo ya está montado
  // (todavía invisible). Va en un efecto aparte, con useLayoutEffect en vez
  // de useEffect, porque useLayoutEffect corre de forma síncrona justo
  // después de que el DOM se actualiza y ANTES de que el navegador pinte --
  // forzar aquí un reflow (offsetHeight) garantiza que el estado inicial
  // invisible ya quedó "confirmado" antes de programar, en el siguiente
  // frame, el cambio a visible. Con un useEffect normal ese orden no está
  // garantizado en todos los navegadores (sobre todo móviles), y ahí la
  // transición de apertura podía perderse aunque la de cierre sí se viera.
  useLayoutEffect(() => {
    if (!montado || !abierto) return
    // eslint-disable-next-line no-unused-expressions
    cajaRef.current?.offsetHeight
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [montado, abierto])

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
    const t = setTimeout(() => (requierePassword ? passwordRef.current : cancelarRef.current)?.focus(), 0)
    return () => clearTimeout(t)
  }, [abierto, requierePassword])

  if (!montado) return null

  function confirmar(e) {
    e?.preventDefault()
    if (requierePassword && !password) {
      setErrorLocal('Ingresa tu contraseña para continuar.')
      return
    }
    setErrorLocal('')
    onConfirmar(requierePassword ? password : undefined, noPreguntar)
  }

  const errorAMostrar = error || errorLocal

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={() => !procesando && onCancelar?.()}
    >
      <form
        ref={cajaRef}
        onSubmit={confirmar}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titulo ? 'confirm-dialog-titulo' : undefined}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-lg transition-all duration-200 ease-out ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'
        }`}
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
            {mensaje && <p className="font-body-md text-body-md text-on-surface-variant break-words">{mensaje}</p>}
          </div>
        </div>

        {requierePassword && (
          <div className="mt-4 flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface">Tu contraseña</label>
            <input
              ref={passwordRef}
              type="password"
              disabled={procesando}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface px-3.5 font-body-md text-body-md text-on-surface transition-colors hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        {permitirNoPreguntar && (
          <label className="mt-4 flex cursor-pointer items-center gap-2.5 font-body-md text-body-md text-on-surface-variant">
            <input
              type="checkbox"
              checked={noPreguntar}
              onChange={(e) => setNoPreguntar(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            {textoNoPreguntar}
          </label>
        )}

        {errorAMostrar && (
          <p className="mt-3 rounded-lg border border-error/30 bg-error-container/40 px-3 py-2 font-label-sm text-label-sm text-error">
            {errorAMostrar}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            ref={requierePassword ? null : cancelarRef}
            type="button"
            disabled={procesando}
            onClick={onCancelar}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60 active:scale-[0.97] transition-transform"
          >
            {textoCancelar}
          </button>
          <button
            type="submit"
            disabled={procesando}
            className={[
              'inline-flex h-10 items-center justify-center rounded-lg px-4 font-label-bold text-label-bold shadow-sm transition-all hover:brightness-110 active:brightness-95 active:scale-[0.97] disabled:opacity-60',
              peligro ? 'bg-error text-on-error' : 'bg-primary text-on-primary',
            ].join(' ')}
          >
            {procesando ? 'Procesando...' : textoConfirmar}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

export default ConfirmDialog
