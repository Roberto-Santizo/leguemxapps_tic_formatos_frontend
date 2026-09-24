// Espera de pantalla completa con el logo que se llena (mockup Sierra,
// "heavy"). Se muestra mientras una operación larga está en curso (guardar un
// acta, generar el PDF): quien la usa la monta con su propio estado de
// "guardando", no agrega lógica. Aparece a los 250ms (index.css) para que una
// respuesta rápida no parpadee.
function EsperaLogo({ mensaje }) {
  return (
    <div role="status" aria-live="polite" className="espera-logo">
      <span aria-hidden="true" className="espera-logo__logo">
        <img src="/logo-legumex-icon.png" alt="" />
        <img src="/logo-legumex-icon.png" alt="" />
      </span>
      <p className="font-mono text-micro uppercase tracking-[0.08em] text-on-surface-variant">{mensaje}</p>
      <span aria-hidden="true" className="espera-logo__barra">
        <span />
      </span>
    </div>
  )
}

export default EsperaLogo
