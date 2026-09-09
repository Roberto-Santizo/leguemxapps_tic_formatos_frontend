// Marcador para un equipo que en la devolución no regresó de verdad (se
// perdió/robaron) -- el backend no tiene un campo de estado para esto, así
// que se guarda dentro del texto de `observations` de ese ítem (el único
// campo que la API sí acepta por ítem) y se detecta después por un prefijo
// fijo, en vez de pedir un campo estructurado nuevo que hoy no existe.
// Se cuenta igual como "devuelto" (se marca y se envía con los demás), tal
// como se pidió: solo cambia cómo se ve después (en rojo).
const PREFIJO_EXTRAVIO = 'EXTRAVÍO:'

/** Antepone el marcador de extravío al texto de observaciones del ítem. */
export function marcarExtravio(observaciones) {
  const texto = (observaciones || '').trim() || 'El equipo no tuvo devolución.'
  return `${PREFIJO_EXTRAVIO} ${texto}`
}

/** True si esas observaciones ya vienen marcadas como extravío. */
export function esExtravio(observaciones) {
  return typeof observaciones === 'string' && observaciones.trim().toUpperCase().startsWith(PREFIJO_EXTRAVIO)
}

/** Observaciones sin el prefijo, para mostrarlas limpias junto al aviso rojo. */
export function textoSinPrefijoExtravio(observaciones) {
  if (!esExtravio(observaciones)) return observaciones || ''
  return observaciones.trim().slice(PREFIJO_EXTRAVIO.length).trim()
}
