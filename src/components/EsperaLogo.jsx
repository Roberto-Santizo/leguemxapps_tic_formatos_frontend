import { useEffect, useRef, useState } from 'react'

// Espera de pantalla completa con el logo que se llena (mockup Sierra,
// "heavy"). Quien la usa le pasa su propio estado de "guardando"
// (`activa`); el componente solo decide cuándo se ve, sin tocar la lógica:
//  - bloquea los clics desde el primer instante, pero se hace visible a los
//    250ms (index.css): una respuesta rápida no la hace parpadear;
//  - una vez visible, se queda al menos 600ms aunque la operación termine
//    antes, para que no sea un destello. No se agregan retrasos a la
//    operación: si la página navega al terminar, la espera se va con ella.
const APARECE_MS = 250
const MINIMO_VISIBLE_MS = 600

function EsperaLogo({ activa, mensaje }) {
  const [montada, setMontada] = useState(Boolean(activa))
  const inicio = useRef(activa ? Date.now() : 0)
  const ultimoMensaje = useRef(mensaje)
  if (activa) ultimoMensaje.current = mensaje

  useEffect(() => {
    if (activa) {
      inicio.current = Date.now()
      setMontada(true)
      return undefined
    }
    const transcurrido = Date.now() - inicio.current
    // Nunca llegó a verse: se quita ya. Si se vio, completa el mínimo.
    const restante = transcurrido < APARECE_MS ? 0 : APARECE_MS + MINIMO_VISIBLE_MS - transcurrido
    if (restante <= 0) {
      setMontada(false)
      return undefined
    }
    const t = setTimeout(() => setMontada(false), restante)
    return () => clearTimeout(t)
  }, [activa])

  if (!montada) return null

  return (
    <div role="status" aria-live="polite" className="espera-logo">
      <span aria-hidden="true" className="espera-logo__logo">
        <img src="/logo-legumex-icon.png" alt="" />
        <img src="/logo-legumex-icon.png" alt="" />
      </span>
      <p className="font-mono text-micro uppercase tracking-[0.08em] text-on-surface-variant">{ultimoMensaje.current}</p>
      <span aria-hidden="true" className="espera-logo__barra">
        <span />
      </span>
    </div>
  )
}

export default EsperaLogo
