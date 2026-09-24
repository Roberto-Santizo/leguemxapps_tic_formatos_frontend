/**
 * Cordillera decorativa del sistema "Sierra": tres capas de montaña en verde
 * bosque, fijas al pie de la pantalla, con deriva horizontal lenta (120s,
 * 80s en contrasentido y 52s). Es puramente presentacional -- sin estado ni
 * lógica -- y va detrás de todo el contenido (z-0, sin eventos de puntero).
 *
 * Regla de contraste: ningún texto a nivel de pantalla va directo sobre la
 * montaña; el contenido que cae encima va en tarjeta blanca o sobre el
 * papel translúcido (`bg-papel-velo` + blur).
 *
 * En móvil las capas quedan quietas y con `prefers-reduced-motion` no se
 * anima nada (reglas `[data-sierra]` en index.css). Se oculta al imprimir.
 *
 * Cada SVG mide el doble del ancho y repite el mismo perfil en su segunda
 * mitad, así el desplazamiento de -50% cierra el ciclo sin salto.
 */

const CAPAS = [
  {
    puntos:
      '0,240 0,60 170,10 340,50 520,0 700,45 870,4 1050,40 1190,12 1280,60 1280,60 1450,10 1620,50 1800,0 1980,45 2150,4 2330,40 2470,12 2560,60 2560,240',
    opacidad: 0.08,
    deriva: 'animate-sierra-lenta',
    retraso: '0ms',
  },
  {
    puntos:
      '0,240 0,120 210,75 400,110 610,60 830,115 1020,80 1280,120 1280,120 1490,75 1680,110 1890,60 2110,115 2300,80 2560,120 2560,240',
    opacidad: 0.22,
    deriva: 'animate-sierra-media',
    retraso: '120ms',
  },
  {
    puntos:
      '0,240 0,180 250,140 460,175 680,130 900,172 1100,145 1280,180 1280,180 1530,140 1740,175 1960,130 2180,172 2380,145 2560,180 2560,240',
    opacidad: 0.42,
    deriva: 'animate-sierra-rapida',
    retraso: '240ms',
  },
]

function SierraFondo({ className = 'fixed inset-x-0 bottom-0 h-[clamp(240px,42vh,420px)]' }) {
  return (
    <div aria-hidden="true" data-sierra data-no-print className={`pointer-events-none z-0 text-bosque ${className}`}>
      {CAPAS.map((capa) => (
        <div
          key={capa.deriva}
          className="absolute inset-0 overflow-hidden animate-sierra-rise"
          style={{ animationDelay: capa.retraso }}
        >
          <svg
            viewBox="0 0 2560 240"
            preserveAspectRatio="none"
            className={`absolute left-0 top-0 block h-full w-[200%] ${capa.deriva}`}
          >
            <polygon points={capa.puntos} fill="currentColor" fillOpacity={capa.opacidad} />
          </svg>
        </div>
      ))}
    </div>
  )
}

export default SierraFondo
