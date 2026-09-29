import { useId } from 'react'

// Cielo dentro del sistema (componente autorizado, equivalente a CieloApp de Tickets
// TIC). Va fijo detrás de todo (con la cordillera de SierraFondo encima), así solo se
// ve en los espacios libres: nunca tapa texto ni recibe clics.
//
// Qué se ve lo decide la HORA (<html data-fase>, config/cielo.js), y el tema solo
// cambia la paleta (index.css, "Cielo según la hora"):
//  - día, amanecer y atardecer: sol con halo y rayos que giran lento, nubes en dos
//    capas (lejos y cerca), motas de luz que suben y una bandada de vez en cuando;
//  - noche: luna creciente, estrellas que titilan y una estrella fugaz cada 5 min.
// Con "reducir movimiento" queda quieto. No se imprime.
const NUBE = 'M10 18a7 7 0 0 1 7-7a9 9 0 0 1 17-2a6 6 0 0 1 8 6a5 5 0 0 1-1 10H13a5 5 0 0 1-3-7z'

const RAYOS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x1: 50 + 29 * c, y1: 50 + 29 * s, x2: 50 + 36 * c, y2: 50 + 36 * s }
})

// [top, ancho, duración, retraso, lejana]
const NUBES = [
  ['5vh', 34, 300, -230, true],
  ['19vh', 28, 340, -90, true],
  ['11vh', 40, 260, -170, true],
  ['8vh', 74, 180, -60, false],
  ['24vh', 58, 210, -140, false],
  ['15vh', 92, 240, -10, false],
]

function CieloSistema() {
  // ids únicos: el mismo dibujo se repite en el login (degradados y máscaras SVG).
  const id = useId().replace(/:/g, '')
  return (
    <div aria-hidden="true" data-no-print className="cielo-sistema">
      <div className="cielo-estrellas" />
      <div className="cielo-fugaz" />
      <div className="cielo-motas" />
      <div className="cielo-astro">
        <svg className="cielo-sol" viewBox="0 0 100 100">
          <defs>
            <radialGradient id={`${id}-luz`}>
              <stop offset="0" stopColor="var(--sol-2)" stopOpacity="0.2" />
              <stop offset="1" stopColor="var(--sol-2)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-halo`}>
              <stop offset="0.3" stopColor="var(--sol-2)" stopOpacity="0.4" />
              <stop offset="1" stopColor="var(--sol-2)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-disco`} cx="0.4" cy="0.38">
              <stop offset="0" stopColor="var(--sol-1)" />
              <stop offset="1" stopColor="var(--sol-2)" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="130" fill={`url(#${id}-luz)`} />
          <circle cx="50" cy="50" r="50" fill={`url(#${id}-halo)`} />
          <g className="cielo-rayos">
            {RAYOS.map((r, i) => (
              <line key={i} x1={r.x1.toFixed(1)} y1={r.y1.toFixed(1)} x2={r.x2.toFixed(1)} y2={r.y2.toFixed(1)} />
            ))}
          </g>
          <circle cx="50" cy="50" r="22" fill={`url(#${id}-disco)`} />
        </svg>
        <svg className="cielo-luna" viewBox="0 0 100 100">
          <defs>
            <mask id={`${id}-creciente`}>
              <rect width="100" height="100" fill="white" />
              <circle cx="63" cy="39" r="25" fill="black" />
            </mask>
            <radialGradient id={`${id}-halo-luna`}>
              <stop offset="0.3" stopColor="var(--luna)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--luna)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="50" fill={`url(#${id}-halo-luna)`} />
          <circle cx="50" cy="50" r="27" fill="var(--luna)" mask={`url(#${id}-creciente)`} />
        </svg>
      </div>
      <div className="cielo-nubes">
        {NUBES.map(([top, ancho, dur, retraso, lejos], i) => (
          <svg
            key={i}
            viewBox="0 0 52 26"
            className={lejos ? 'cielo-nube-lejos' : undefined}
            style={{ top, width: ancho, animationDuration: `${dur}s`, animationDelay: `${retraso}s` }}
          >
            <path d={NUBE} />
          </svg>
        ))}
      </div>
      <svg className="cielo-aves" viewBox="0 0 120 44">
        <path d="M8 22q6-7 12 0q6-7 12 0" />
        <path d="M40 10q5-6 10 0q5-6 10 0" />
        <path d="M44 34q4-5 8 0q4-5 8 0" />
        <path d="M72 18q5-6 10 0q5-6 10 0" />
      </svg>
    </div>
  )
}

export default CieloSistema
