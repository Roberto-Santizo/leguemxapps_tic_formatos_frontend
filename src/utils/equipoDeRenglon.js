// Un renglón de un acta (detalle de entrega o de devolución) no es el equipo:
// trae nombre, marca, serie... y a veces `equipment_id`. Cuando no lo trae, el
// equipo se encuentra por su serie en el catálogo (GET /equipments completo,
// que sí trae id y serie). Lo usan el ojo de cada renglón (useFichaEquipo) y
// las características del PDF (pdf/datosPdf.js).

// Serie comparable: sin espacios ni guiones y en mayúsculas, igual que la
// búsqueda por serie del selector de equipo.
export function serieComparable(valor) {
  return String(valor ?? '').replace(/[\s-]+/g, '').toUpperCase()
}

/** Id del equipo que viene en el renglón, o null. */
export function idDirectoDelRenglon(item) {
  return item?.equipment_id ?? item?.equipment?.id ?? null
}

/**
 * Equipo del catálogo que corresponde al renglón, buscado por serie. Si hay
 * dos con la misma serie, desempata el nombre. null si no hay coincidencia.
 */
export function equipoPorSerie(catalogo, item) {
  const serie = serieComparable(item?.equipment_serie)
  if (!serie || !Array.isArray(catalogo)) return null
  const mismos = catalogo.filter((e) => serieComparable(e.serie) === serie)
  if (mismos.length === 1) return mismos[0]
  const nombre = String(item.equipment_name ?? '').trim().toLowerCase()
  return mismos.find((e) => String(e.name ?? '').trim().toLowerCase() === nombre) || null
}
