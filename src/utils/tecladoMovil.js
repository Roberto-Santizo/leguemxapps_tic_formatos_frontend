// Teclado en pantalla de teléfono y tablet (se llama una vez, en main.jsx).
//
// - iPhone no achica la página al sacar el teclado: lo pone ENCIMA. Se publica el
//   área visible real en variables CSS para que lo que va fijo abajo o a pantalla
//   completa quede sobre el teclado: --vv-alto (alto visible), --vv-arriba (su
//   corrimiento) y --vv-abajo (lo que tapa el teclado desde abajo), y se marca
//   <html data-teclado> mientras está abierto. Sirve para cualquier teclado (del
//   sistema, flotante, de terceros, con barra de sugerencias): nunca se asume un alto.
//   En Android, con interactive-widget=resizes-content (index.html), la ventana ya se
//   achica y --vv-abajo queda en 0.
// - Al enfocar un campo TOCÁNDOLO (o con la tecla "siguiente") en pantalla táctil, se
//   centra en lo visible cuando el teclado ya subió. El autofoco del código (login) no
//   mueve la página: ahí el teléfono no abre el teclado.
// Con zoom de pellizco no se toca nada: el alto visible cambia por el zoom, no por el
// teclado.

const TACTIL = '(hover: none) and (pointer: coarse)'

export function iniciarTecladoMovil() {
  const raiz = document.documentElement
  const vv = window.visualViewport

  if (vv) {
    const alCambiar = () => {
      if (vv.scale > 1.05) return
      const alto = Math.round(vv.height)
      const arriba = Math.round(vv.offsetTop)
      const abajo = Math.max(0, Math.round(window.innerHeight - arriba - alto))
      raiz.style.setProperty('--vv-alto', `${alto}px`)
      raiz.style.setProperty('--vv-arriba', `${arriba}px`)
      raiz.style.setProperty('--vv-abajo', `${abajo}px`)
      const abierto = abajo > 120
      if (abierto !== raiz.hasAttribute('data-teclado')) raiz.toggleAttribute('data-teclado', abierto)
    }
    vv.addEventListener('resize', alCambiar)
    vv.addEventListener('scroll', alCambiar)
    alCambiar()
  }

  let temporizador = null
  let ultimoGesto = 0
  const marcarGesto = () => { ultimoGesto = Date.now() }
  document.addEventListener('pointerdown', marcarGesto, true)
  document.addEventListener('keydown', marcarGesto, true)
  document.addEventListener('focusin', (e) => {
    const el = e.target
    if (!window.matchMedia?.(TACTIL).matches) return
    if (Date.now() - ultimoGesto > 1000) return
    if (!el || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || /^(checkbox|radio|file|range)$/.test(el.type)) return
    clearTimeout(temporizador)
    temporizador = setTimeout(() => {
      if (document.activeElement === el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 350)
  })
}
