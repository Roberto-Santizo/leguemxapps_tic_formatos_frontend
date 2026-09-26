import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// Momento de "acta registrada" (mockup Sierra, celebración al crear): check
// que se dibuja, dos anillos que se expanden y chispas.
//
// Con `acciones` ({ ver, cerrar, textoVer }) deja de ser un instante que se
// va solo: queda abierto con "Ver acta" (lleva al acta recién creada) y
// "Cerrar" (sigue a donde la página iba antes). Esc también cierra.
const CHISPAS = [0, 45, 90, 135, 180, 225, 270, 315].map((grados, i) => ({
  grados,
  color: ['#15803d', '#4d7c2a', '#9bc96a', '#0b2a1e'][i % 4],
  retraso: 120 + i * 45,
}))

function ActaRegistrada({ codigo, titulo, detalle, acciones }) {
  const botonVer = useRef(null)
  // `acciones` llega como objeto nuevo en cada render: se lee por ref para no
  // reiniciar el foco ni el listener de Esc a cada rato.
  const accionesRef = useRef(acciones)
  accionesRef.current = acciones
  const conAcciones = Boolean(acciones)

  useEffect(() => {
    if (!conAcciones) return undefined
    // El foco pasa al diálogo: con teclado, Enter abre el acta.
    const t = setTimeout(() => botonVer.current?.focus(), 450)
    function alTeclear(e) {
      if (e.key === 'Escape') accionesRef.current?.cerrar()
    }
    document.addEventListener('keydown', alTeclear)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [conAcciones])

  return createPortal(
    <div
      role={acciones ? 'dialog' : 'status'}
      aria-modal={acciones ? 'true' : undefined}
      aria-live={acciones ? undefined : 'polite'}
      aria-label={acciones ? titulo : undefined}
      className="acta-lista"
    >
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
        {acciones && (
          <div className="acta-lista__acciones mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <button
              type="button"
              onClick={acciones.cerrar}
              className="inline-flex h-10 items-center justify-center rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97] sm:min-w-[8.5rem]"
            >
              Cerrar
            </button>
            <button
              ref={botonVer}
              type="button"
              onClick={acciones.ver}
              className="inline-flex h-10 items-center justify-center rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97] sm:min-w-[8.5rem]"
            >
              {acciones.textoVer || 'Ver acta'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default ActaRegistrada
