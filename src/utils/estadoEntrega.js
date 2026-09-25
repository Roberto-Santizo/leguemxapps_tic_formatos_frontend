// Estado de una entrega según lo que ya se devolvió de ella (`status` del
// documento de entrega, o `delivery_document_status` en una devolución). Lo
// calcula el backend; aquí solo se traduce y se le pone color.

export function nombreEstado(status) {
  if (status === 'devuelto') return 'Devuelto'
  if (status === 'parcial') return 'Parcial'
  if (status === 'pendiente') return 'Pendiente'
  return '—'
}

// Punto de color del chip de estado (solo decorativo): devuelto = salvia,
// parcial = ocre, el resto gris -- los mismos acentos apagados de Equipos.
export function puntoEstado(status) {
  if (status === 'devuelto') return 'bg-available'
  if (status === 'parcial') return 'bg-assigned'
  return 'bg-outline'
}

// Opciones del filtro "Estado" de las listas de actas (FiltrosActas).
export const OPCIONES_ESTADO_ENTREGA = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'pendiente', etiqueta: 'Pendiente', punto: 'bg-outline' },
  { valor: 'parcial', etiqueta: 'Parcial', punto: 'bg-assigned' },
  { valor: 'devuelto', etiqueta: 'Devuelto', punto: 'bg-available' },
]
