// Tema claro / oscuro / automático (sigue al equipo). Se guarda en localStorage y
// index.html lo aplica antes de pintar (mismo nombre de clave), para que no parpadee.
// Los colores cambian solos: son variables CSS (src/tema/paleta.js).

export const CLAVE_TEMA = 'legumex_tema'
export const TEMAS = ['auto', 'claro', 'oscuro']

export function leerTema() {
  try {
    const t = localStorage.getItem(CLAVE_TEMA)
    return t === 'claro' || t === 'oscuro' ? t : 'auto'
  } catch {
    return 'auto'
  }
}

export function aplicarTema(tema) {
  const raiz = document.documentElement
  if (tema === 'claro' || tema === 'oscuro') raiz.setAttribute('data-tema', tema)
  else raiz.removeAttribute('data-tema')
  try {
    if (tema === 'auto') localStorage.removeItem(CLAVE_TEMA)
    else localStorage.setItem(CLAVE_TEMA, tema)
  } catch {
    // sin almacenamiento: el tema dura hasta recargar
  }
}

export function siguienteTema(tema) {
  return TEMAS[(TEMAS.indexOf(tema) + 1) % TEMAS.length]
}
