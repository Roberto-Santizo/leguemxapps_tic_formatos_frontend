// Indicador de carga con el isotipo de Legumex que se llena de izquierda a
// derecha (mockup Sierra, `logoLoop`). Reemplaza al círculo que gira en los
// botones que guardan o generan algo. Puramente decorativo: el estado de
// "guardando" lo sigue anunciando el propio botón (texto / disabled).
//   tono: 'claro' (sobre botón negro) | 'tinta' (sobre fondo claro)
function IsotipoCarga({ tono = 'claro', className = 'h-4' }) {
  return (
    <span aria-hidden="true" className={`isotipo-carga isotipo-carga--${tono} ${className}`}>
      <img src="/logo-legumex-icon.png" alt="" />
      <img src="/logo-legumex-icon.png" alt="" />
    </span>
  )
}

export default IsotipoCarga
