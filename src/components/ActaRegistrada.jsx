// Momento de "acta registrada" (mockup Sierra, celebración al crear): check
// que se dibuja, dos anillos que se expanden y chispas. Solo presentación: la
// página lo muestra un instante después de guardar y luego navega como antes.
const CHISPAS = [0, 45, 90, 135, 180, 225, 270, 315].map((grados, i) => ({
  grados,
  color: ['#15803d', '#4d7c2a', '#9bc96a', '#0b2a1e'][i % 4],
  retraso: 120 + i * 45,
}))

function ActaRegistrada({ codigo, titulo, detalle }) {
  return (
    <div role="status" aria-live="polite" className="acta-lista">
      <div className="acta-lista__tarjeta">
        <div aria-hidden="true" className="acta-lista__sello">
          <span className="acta-lista__anillo" style={{ animationDelay: '120ms' }} />
          <span className="acta-lista__anillo" style={{ animationDelay: '320ms' }} />
          <div className="acta-lista__circulo">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4.5 12.5 5 5 10-10" />
            </svg>
          </div>
          {CHISPAS.map((c) => (
            <span key={c.grados} className="acta-lista__chispa" style={{ transform: `rotate(${c.grados}deg)` }}>
              <span style={{ background: c.color, animationDelay: `${c.retraso}ms` }} />
            </span>
          ))}
        </div>
        <p className="font-mono text-micro uppercase tracking-[0.04em] text-on-surface-variant">{codigo}</p>
        <p className="mt-2 font-body-lg text-titulo-modal text-on-surface">{titulo}</p>
        {detalle && <p className="mt-1.5 font-body-md text-body-md text-on-surface-variant">{detalle}</p>}
      </div>
    </div>
  )
}

export default ActaRegistrada
