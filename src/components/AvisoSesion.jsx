import { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { EVENTO_SESION_EXPIRADA } from '../services/api.js'

// Aviso de sesión por vencer. El token dura 60 min y no se renueva; antes
// vencía sin aviso y el primer indicio era perder el trabajo al guardar. Cinco
// minutos antes aparece esta tarjeta con la cuenta regresiva; al vencer
// cambia a "Tu sesión venció" con un botón para volver a entrar. No cierra la
// sesión por su cuenta: quien está firmando termina su trazo y decide. Lo
// que se lleva de un acta ya está guardado como borrador (useBorradorActa).
// Se monta una vez, en AppLayout.
const AVISAR_ANTES_MS = 5 * 60 * 1000

function formatoCuenta(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function AvisoSesion() {
  const { venceEn } = useAuth()
  const [ahora, setAhora] = useState(() => Date.now())
  const [oculto, setOculto] = useState(false)

  // Un reloj que solo late cuando hace falta: lejos del vencimiento se
  // despierta una vez, justo al entrar en los últimos 5 minutos.
  useEffect(() => {
    if (!venceEn) return undefined
    const faltan = venceEn - Date.now()
    if (faltan > AVISAR_ANTES_MS) {
      const t = setTimeout(() => setAhora(Date.now()), faltan - AVISAR_ANTES_MS + 50)
      return () => clearTimeout(t)
    }
    if (faltan <= 0) return undefined
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [venceEn, ahora])

  // Token nuevo (volvió a entrar): el aviso vuelve a estar disponible.
  useEffect(() => setOculto(false), [venceEn])

  if (!venceEn) return null
  const faltan = venceEn - ahora
  const vencida = faltan <= 0
  if (faltan > AVISAR_ANTES_MS || (oculto && !vencida)) return null

  return (
    <div
      role={vencida ? 'alert' : 'status'}
      aria-live="polite"
      className="fixed inset-x-3 top-[calc(theme(spacing.barra-movil)+0.75rem)] z-[70] mx-auto max-w-lg animate-pop-in rounded-tarjeta border border-assigned/40 bg-white px-4 py-3 shadow-flotante md:left-[calc(theme(spacing.drawer-width)+1rem)] md:right-4 md:top-4"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center self-start rounded-full bg-assigned-container text-on-assigned-container">
          <Clock3 className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1 basis-48">
          <p className="font-body-md text-body-md font-semibold text-on-surface">
            {vencida ? (
              'Tu sesión venció'
            ) : (
              <>
                Tu sesión vence en <span className="font-mono tabular-nums">{formatoCuenta(faltan)}</span>
              </>
            )}
          </p>
          <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
            {vencida
              ? 'Vuelve a entrar para seguir. Si estabas llenando un acta, se recupera al abrirla de nuevo.'
              : 'Si estás llenando un acta, finalízala ahora. Lo que lleves se guarda como borrador.'}
          </p>
        </div>
        {vencida ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(EVENTO_SESION_EXPIRADA))}
            className="ml-auto inline-flex h-9 shrink-0 items-center justify-center rounded-boton bg-tinta px-3 font-body-md text-body-md font-medium text-white transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97]"
          >
            Iniciar sesión
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOculto(true)}
            className="ml-auto inline-flex h-9 shrink-0 items-center justify-center rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
          >
            Entendido
          </button>
        )}
      </div>
    </div>
  )
}

export default AvisoSesion
