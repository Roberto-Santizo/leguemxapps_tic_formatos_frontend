import { useId } from 'react'

/**
 * Cordillera decorativa del sistema "Sierra": tres capas de montaña en verde
 * bosque, fijas al pie de la pantalla, con deriva horizontal lenta (120s,
 * 80s en contrasentido y 52s). Es puramente presentacional -- sin estado ni
 * lógica -- y va detrás de todo el contenido (z-0, sin eventos de puntero).
 *
 * Regla de contraste: ningún texto a nivel de pantalla va directo sobre la
 * montaña; el contenido que cae encima va en tarjeta blanca o sobre papel
 * opaco (`bg-papel`: barras inferiores, cabeceras y pie), sin blur.
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
    brillo: '1.2s', // la de atrás, la última en brillar
  },
  {
    puntos:
      '0,240 0,120 210,75 400,110 610,60 830,115 1020,80 1280,120 1280,120 1490,75 1680,110 1890,60 2110,115 2300,80 2560,120 2560,240',
    opacidad: 0.22,
    deriva: 'animate-sierra-media',
    retraso: '120ms',
    brillo: '0.6s',
  },
  {
    puntos:
      '0,240 0,180 250,140 460,175 680,130 900,172 1100,145 1280,180 1280,180 1530,140 1740,175 1960,130 2180,172 2380,145 2560,180 2560,240',
    opacidad: 0.42,
    deriva: 'animate-sierra-rapida',
    retraso: '240ms',
    brillo: '0s', // la del frente (abajo): el destello empieza aquí
  },
]

/*
 * Ráfagas de viento: trazos finos y curvos, en el verde de la marca muy
 * tenue, que cruzan el cielo de la cordillera de izquierda a derecha y cierran
 * en un pequeño remolino. Cada trazo es un segmento corto que recorre su curva
 * (stroke-dasharray con pathLength=1, index.css .sierra-viento), escalonados y
 * con descanso largo. `slice`: en pantallas angostas se recortan los lados en
 * vez de aplastar los remolinos.
 */
const RAFAGAS = [
  { d: 'M -20 70 C 180 50, 360 88, 560 68 S 860 44, 980 60 c 36 5 44 -26 18 -33 c -20 -5 -31 14 -16 22', retraso: '0s' },
  { d: 'M 300 128 C 500 110, 680 142, 900 122 S 1180 100, 1290 114 c 30 4 36 -20 14 -26 c -16 -4 -25 11 -12 18', retraso: '2.2s' },
  { d: 'M 120 26 C 300 12, 470 40, 650 28 S 900 10, 1020 22', retraso: '4.6s' },
]

/*
 * Destello ("light sweep"): una franja de luz diagonal que cruza cada capa de
 * izquierda a derecha, recortada a la silueta de esa capa (clipPath), como el
 * sol reflejándose en la cordillera. Empieza en la capa del frente (abajo) y
 * sube a la del medio y a la de atrás con un pequeño retraso; pasa en ~1.5s y
 * descansa el resto del ciclo (index.css, .sierra-brillo). Va dentro del mismo
 * SVG que deriva, así sigue a su montaña. Sin movimiento reducido: no se ve.
 */
function SierraFondo({ className = 'fixed inset-x-0 bottom-0 h-[clamp(240px,42vh,420px)]' }) {
  const id = useId().replace(/:/g, '')
  return (
    <div aria-hidden="true" data-sierra data-no-print className={`pointer-events-none z-0 text-bosque ${className}`}>
      {CAPAS.map((capa, i) => (
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
            <defs>
              <clipPath id={`${id}-capa-${i}`}>
                <polygon points={capa.puntos} />
              </clipPath>
              <linearGradient id={`${id}-luz-${i}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0.7" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={capa.puntos} fill="currentColor" fillOpacity={capa.opacidad} />
            <g clipPath={`url(#${id}-capa-${i})`}>
              <rect
                className="sierra-brillo"
                style={{ animationDelay: capa.brillo }}
                x="-600"
                y="-40"
                width="300"
                height="320"
                fill={`url(#${id}-luz-${i})`}
              />
            </g>
          </svg>
        </div>
      ))}
      <svg
        viewBox="0 0 1440 240"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 -top-[30%] block h-[80%] w-full overflow-visible"
      >
        {RAFAGAS.map((r) => (
          <path key={r.retraso} className="sierra-viento" d={r.d} pathLength="1" style={{ animationDelay: r.retraso }} />
        ))}
      </svg>
    </div>
  )
}

export default SierraFondo
