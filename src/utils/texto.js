/**
 * Texto en minúsculas y sin espacios, guiones, puntos ni guiones bajos, para
 * comparar contra lo que teclea el usuario.
 *
 * Está pensado para las series de equipo, que en la etiqueta física vienen con
 * separadores caprichosos: así "ABC-123 45" y "abc12345" se encuentran igual, y
 * teclear los últimos caracteres del sticker basta para dar con el equipo.
 *
 * Vive aquí, y no dentro de un componente, porque lo usan dos buscadores
 * distintos -- el de la lista de Equipos y el selector de equipo de Entrega de
 * Equipo -- y tienen que filtrar con la misma regla: si uno encuentra la serie y
 * el otro no, el usuario cree que el equipo no existe.
 */
export function normalizarBusqueda(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .replace(/[\s\-_.]/g, '')
}

/**
 * Nombre comparable: sin acentos, sin espacios de sobra y en minúsculas. Lo
 * usa el historial por departamento para emparejar el nombre del
 * departamento con `employee_department` de cada acta, que el backend manda
 * como texto (no como id): así "Tecnologías de la Información" y
 * "tecnologias de la informacion " se reconocen como el mismo.
 */
export function normalizarNombre(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}
