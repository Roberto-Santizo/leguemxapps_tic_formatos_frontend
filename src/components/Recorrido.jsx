import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Recorrido guiado "¿Cómo funciona?" (componente autorizado, equivalente al de Tickets
// TIC). Oscurece la pantalla, ilumina lo que se explica y muestra una tarjeta con el
// paso. Los pasos viven en config/recorrido.js. Lo monta AppLayout, que le presta el
// menú: en teléfono y tablet los pasos `enMenu` abren el cajón.
// Teclado: → siguiente, ← anterior, Esc salir. Con "reducir movimiento" no se anima.
const ESCRITORIO = '(min-width: 768px) and (hover: hover) and (pointer: fine)'
const PAD = 8
const HUECO = 16

// Fijo (el cajón del menú): no se desplaza la página para mostrarlo.
function esFijo(el) {
  for (let e = el; e && e !== document.body; e = e.parentElement) {
    if (getComputedStyle(e).position === 'fixed') return true
  }
  return false
}

function visible(el) {
  const b = el.getBoundingClientRect()
  return b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== 'hidden' && b.right > 0 && b.left < window.innerWidth
}

function Recorrido({ pasos, onMenu, onCerrar }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const [escritorio, setEscritorio] = useState(() => window.matchMedia(ESCRITORIO).matches)
  const tarjeta = useRef(null)
  const siguienteRef = useRef(null)
  const llevarHasta = useRef(0)
  const paso = pasos[Math.min(i, pasos.length - 1)]

  // Mide dónde está lo que se explica; `llevar` lo desplaza a la vista (solo al
  // cambiar de paso: después el usuario puede mover la página si quiere).
  const medir = useCallback(() => {
    const llevar = Date.now() < llevarHasta.current
    let el = null
    for (const sel of paso.donde || []) {
      el = Array.prototype.find.call(document.querySelectorAll(sel), visible) || null
      if (el) break
    }
    if (el && llevar) {
      const b = el.getBoundingClientRect()
      const H = window.innerHeight
      if (esFijo(el)) {
        if (b.top < 16 || b.bottom > H - 16) el.scrollIntoView({ block: 'nearest' })
      } else if (!window.matchMedia(ESCRITORIO).matches) {
        // teléfono y tablet: la tarjeta va abajo, así que lo explicado sube
        if (b.top < 64 || b.bottom > H * 0.55) {
          el.style.scrollMarginTop = '72px'
          el.scrollIntoView({ block: 'start' })
          el.style.scrollMarginTop = ''
        }
      } else if (b.top < 0 || b.bottom > H) {
        el.scrollIntoView({ block: 'center' })
      }
    }
    const b = el?.getBoundingClientRect()
    const nuevo = b
      ? {
          x: Math.round(b.left),
          y: Math.round(b.top),
          w: Math.round(b.width),
          h: Math.round(b.height),
          r: Math.min(Math.round(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0), Math.round(Math.min(b.width, b.height) / 2)),
        }
      : null
    setRect((prev) => (JSON.stringify(prev) === JSON.stringify(nuevo) ? prev : nuevo))
  }, [paso])

  // Cada paso: abre o cierra el menú del teléfono y lleva lo explicado a la vista
  // durante el primer momento (el cajón todavía se está deslizando).
  useLayoutEffect(() => {
    const movil = !window.matchMedia(ESCRITORIO).matches
    onMenu(movil && !!paso.enMenu)
    llevarHasta.current = Date.now() + 900
    const raf = requestAnimationFrame(medir)
    return () => cancelAnimationFrame(raf)
  }, [paso, medir, onMenu])

  // Lo explicado puede moverse sin desplazamiento (termina de cargar, animaciones):
  // mientras dura el recorrido se mide seguido y solo se repinta si cambió.
  useEffect(() => {
    let raf = 0
    const alMover = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(medir)
    }
    const mq = window.matchMedia(ESCRITORIO)
    const alCambiarEquipo = () => setEscritorio(mq.matches)
    const t = setInterval(medir, 250)
    window.addEventListener('resize', alMover)
    window.addEventListener('scroll', alMover, true)
    mq.addEventListener?.('change', alCambiarEquipo)
    return () => {
      clearInterval(t)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', alMover)
      window.removeEventListener('scroll', alMover, true)
      mq.removeEventListener?.('change', alCambiarEquipo)
    }
  }, [medir])

  const salir = useCallback(() => {
    onMenu(false)
    onCerrar()
  }, [onMenu, onCerrar])

  const mover = useCallback(
    (d) => {
      const n = i + d
      if (n < 0) return
      if (n >= pasos.length) salir()
      else setI(n)
    },
    [i, pasos.length, salir]
  )

  // Teclado y foco: el foco entra a la tarjeta y vuelve a donde estaba al salir.
  useEffect(() => {
    const previo = document.activeElement
    siguienteRef.current?.focus({ preventScroll: true })
    return () => {
      if (previo && document.contains(previo)) previo.focus?.({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === 'Escape') salir()
      else if (e.key === 'ArrowRight') mover(1)
      else if (e.key === 'ArrowLeft') mover(-1)
      else if (e.key === 'Tab') {
        // el foco no se escapa de la tarjeta
        const botones = tarjeta.current?.querySelectorAll('button') || []
        const primero = botones[0]
        const ultimo = botones[botones.length - 1]
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault()
          ultimo?.focus()
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault()
          primero?.focus()
        }
      } else return
      if (e.key !== 'Tab') e.preventDefault()
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [salir, mover])

  const W = window.innerWidth
  const H = window.innerHeight
  const R = rect
  const ANCHO = Math.min(360, W - 32)
  const entre = (n, a, b) => Math.max(a, Math.min(b, n))

  // Recuadro iluminado: copia la curva del elemento y no se sale de la pantalla.
  let foco = null
  if (R) {
    const fx = Math.max(2, R.x - PAD)
    const fy = Math.max(2, R.y - PAD)
    const fr = Math.min(W - 2, R.x + R.w + PAD)
    const fb = Math.min(H - 2, R.y + R.h + PAD)
    foco = { left: fx, top: fy, width: fr - fx, height: fb - fy, borderRadius: R.r + PAD }
  }

  // Dónde va la tarjeta, sin tapar lo que se explica.
  let pos
  if (!escritorio) {
    // teléfono y tablet: hoja abajo; si lo iluminado está en la mitad de abajo, arriba
    const arriba = R && R.y + R.h / 2 > H / 2
    pos = arriba
      ? { left: 12, right: 12, top: 'calc(12px + env(safe-area-inset-top))' }
      : { left: 12, right: 12, bottom: 'calc(12px + env(safe-area-inset-bottom))' }
  } else if (!R) {
    pos = { left: (W - ANCHO) / 2, top: H * 0.3, width: ANCHO }
  } else if (R.x + R.w + PAD + HUECO + ANCHO <= W - 16) {
    pos = { left: R.x + R.w + PAD + HUECO, top: entre(R.y - PAD, 16, H - 300), width: ANCHO }
  } else if (R.y + R.h + PAD + HUECO + 240 <= H) {
    pos = { left: entre(R.x, 16, W - ANCHO - 16), top: R.y + R.h + PAD + HUECO, width: ANCHO }
  } else if (R.y - PAD - HUECO - 200 >= 0) {
    pos = { left: entre(R.x, 16, W - ANCHO - 16), bottom: H - (R.y - PAD - HUECO), width: ANCHO }
  } else {
    pos = { left: entre(R.x - PAD - HUECO - ANCHO, 16, W - ANCHO - 16), top: entre(R.y, 16, H - 300), width: ANCHO }
  }

  const ultimo = i === pasos.length - 1

  return createPortal(
    <div data-no-print data-recorrido-capa className="fixed inset-0 z-[90] animate-overlay-in">
      {/* Bloquea los clics mientras dura; oscurece si no hay nada iluminado. */}
      <div onClick={salir} className={`absolute inset-0 ${R ? '' : 'bg-[rgba(10,12,10,0.55)]'}`} />
      {foco && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed shadow-[0_0_0_2px_rgb(var(--c-surface)),0_0_0_9999px_rgba(10,12,10,0.55)] transition-[left,top,width,height,border-radius] duration-300 ease-standard"
          style={foco}
        />
      )}
      <div
        ref={tarjeta}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recorrido-titulo"
        aria-describedby="recorrido-texto"
        className="fixed mx-auto max-w-[560px] rounded-tarjeta border border-outline-variant bg-white px-5 pb-4 pt-4 text-on-surface shadow-flotante transition-[left,top,bottom,width] duration-300 ease-standard"
        style={pos}
      >
        <div key={i} className="animate-view-in">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-micro font-medium uppercase tracking-[0.1em] text-on-surface-variant">
              Paso {i + 1} de {pasos.length}
            </span>
            <button
              type="button"
              onClick={salir}
              aria-label="Salir del recorrido"
              className="rounded-boton px-2 py-1 font-body-md text-body-md font-medium text-on-surface-variant transition-colors duration-fast ease-standard hover:bg-surface-container hover:text-on-surface"
            >
              Salir
            </button>
          </div>
          <h2 id="recorrido-titulo" className="mt-1 font-headline-md text-headline-md font-bold text-on-surface">
            {paso.titulo}
          </h2>
          <p id="recorrido-texto" className="mt-1.5 font-body-md text-body-md text-pretty text-on-surface-variant">
            {paso.texto}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div aria-hidden="true" className="flex min-w-0 items-center gap-[3px] overflow-hidden">
            {pasos.map((_, k) => (
              <span
                key={k}
                className={`h-[5px] shrink-0 rounded-full transition-[width,background-color] duration-base ease-standard ${k === i ? 'w-3.5 bg-on-surface' : 'w-[5px] bg-outline'}`}
              />
            ))}
          </div>
          <div className="flex shrink-0 gap-2">
            {i > 0 && (
              <button type="button" onClick={() => mover(-1)} className="btn-secundario h-10 px-4">
                Anterior
              </button>
            )}
            <button ref={siguienteRef} type="button" onClick={() => mover(1)} className="btn-primario h-10 px-4">
              {ultimo ? 'Terminar' : i === 0 ? 'Empezar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default Recorrido
