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
