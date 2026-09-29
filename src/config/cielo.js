// Cielo según la hora de GUATEMALA (UTC-6, sin horario de verano), no la del equipo.
// Mismos cortes que Tickets TIC: amanecer 5:30–7:00, día hasta 17:15, atardecer hasta
// 18:45 y noche el resto. index.html repite estos cortes en su script temprano (para
// que la fase esté puesta antes de pintar): si cambian aquí, cambiar allá.
//
// La fase se marca en <html data-fase> y decide qué hay en el cielo (sol o luna,
// estrellas, nubes, aves); el tema claro/oscuro solo cambia la paleta.

export const FASES_CIELO = [
  { fase: 'noche', hasta: 5 * 60 + 30 },
  { fase: 'amanecer', hasta: 7 * 60 },
  { fase: 'dia', hasta: 17 * 60 + 15 },
  { fase: 'atardecer', hasta: 18 * 60 + 45 },
  { fase: 'noche', hasta: 24 * 60 },
]

/** Minutos desde la medianoche en Guatemala. */
export function minutosGuatemala(ahora = new Date()) {
  const gt = new Date(ahora.getTime() + (ahora.getTimezoneOffset() - 360) * 60000)
  return gt.getHours() * 60 + gt.getMinutes()
}

export function faseCielo(ahora = new Date()) {
  const m = minutosGuatemala(ahora)
  return FASES_CIELO.find((f) => m < f.hasta).fase
}

// Saludo que coincide con el cielo: de noche siempre "Buenas noches".
export function saludoHora(ahora = new Date()) {
  const fase = faseCielo(ahora)
  if (fase === 'noche') return 'Buenas noches'
  if (fase === 'amanecer') return 'Buenos días'
  return minutosGuatemala(ahora) < 12 * 60 ? 'Buenos días' : 'Buenas tardes'
}

// Pone la fase al abrir y la revisa cada minuto (se llama una vez, en main.jsx).
export function iniciarFaseCielo() {
  const aplicar = () => {
    const fase = faseCielo()
    if (document.documentElement.getAttribute('data-fase') !== fase) {
      document.documentElement.setAttribute('data-fase', fase)
    }
  }
  aplicar()
  setInterval(aplicar, 60000)
}
