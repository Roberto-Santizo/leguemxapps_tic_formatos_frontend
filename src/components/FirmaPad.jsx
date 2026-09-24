import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { CheckCircle2, Upload } from 'lucide-react'

// --- Firma "Registro histórico / firmado en papel" (Fase 1.3) ---
// Sin campo de nota (se quitó a pedido -- solo se confirma, sin texto
// personalizado): genera siempre la misma leyenda fija como imagen (PNG),
// para reutilizar el mismo pipeline de subida/embebido que las otras dos
// opciones, sin tocar backend ni base de datos.
function notaHistoricaAPng() {
  const canvas = document.createElement('canvas')
  canvas.width = 480
  canvas.height = 120
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#9e9e9e'
  ctx.setLineDash([6, 4])
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)
  ctx.fillStyle = '#333333'
  ctx.font = 'italic 20px serif'
  ctx.textAlign = 'center'
  ctx.fillText('Firmado en documento físico', canvas.width / 2, 55)
  ctx.font = '14px sans-serif'
  ctx.fillStyle = '#666666'
  ctx.fillText('Registro migrado / archivado en papel', canvas.width / 2, 85)
  return canvas.toDataURL('image/png')
}

// Encabezado del bloque de firma.
// CAMBIO DE DISEÑO: el título va ARRIBA del recuadro (antes iba debajo).
// Un rótulo que aparece después del control obliga a leer hacia atrás para
// saber qué se está firmando; arriba funciona como etiqueta del campo, igual
// que el resto del formulario.
function EncabezadoFirma({ titulo, subtitulo }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <p className="text-[12px] font-semibold leading-4 text-on-surface">{titulo}</p>
      {subtitulo && (
        <p className="shrink-0 font-label-sm text-label-sm text-on-surface-subtle">{subtitulo}</p>
      )}
    </div>
  )
}

// Captura una firma de tres formas (dibujada como vector, subida como
// imagen, o marcada como registro histórico/firmado en papel), muestra una
// vista previa, y solo la entrega al padre cuando el usuario pulsa
// "Confirmar firma" — antes de eso nada queda guardado. Una vez confirmada,
// se bloquea (solo lectura) hasta que se pulse "Reiniciar firma", que el
// padre decide si requiere contraseña o no.
function FirmaPad({ titulo, subtitulo, firmaUrl, onConfirmar, onReiniciar }) {
  const sigCanvasRef = useRef(null)
  const [modo, setModo] = useState('dibujar') // 'dibujar' | 'subir' | 'historico'
  const [previewSubida, setPreviewSubida] = useState(null)
  const [vacio, setVacio] = useState(true)

  function limpiarLienzo() {
    sigCanvasRef.current?.clear()
    setVacio(true)
  }

  function handleArchivo(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewSubida(reader.result)
      setVacio(false)
    }
    reader.readAsDataURL(archivo)
  }

  function handleConfirmar() {
    let dataUrl = null
    if (modo === 'dibujar') {
      if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) return
      // Se rasteriza el trazo directamente como PNG (antes se exportaba
      // como SVG vectorial, pero Supabase Storage no lo está sirviendo bien).
      const canvas = sigCanvasRef.current.getTrimmedCanvas
        ? sigCanvasRef.current.getTrimmedCanvas()
        : sigCanvasRef.current.getCanvas()
      dataUrl = canvas.toDataURL('image/png')
    } else if (modo === 'subir') {
      if (!previewSubida) return
      dataUrl = previewSubida
    } else {
      dataUrl = notaHistoricaAPng()
    }
    onConfirmar(dataUrl)
  }

  function handleReiniciar() {
    limpiarLienzo()
    setPreviewSubida(null)
    setVacio(true)
    onReiniciar()
  }

  if (firmaUrl) {
    return (
      <div className="flex flex-col rounded-xl border border-outline-variant bg-white p-3">
        <EncabezadoFirma titulo={titulo} subtitulo={subtitulo} />
        <div className="grid aspect-[5/2] w-full animate-pop-in place-items-center rounded-boton border border-outline-variant bg-surface-container-low p-2">
          <img src={firmaUrl} alt={`Firma de ${titulo}`} className="max-h-full max-w-full object-contain" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-on-surface-variant">
            <CheckCircle2 className="h-3.5 w-3.5 animate-badge-pop text-on-surface" strokeWidth={2} />
            Firma confirmada
          </div>
          <button
            type="button"
            onClick={handleReiniciar}
            className="rounded-boton px-2 py-1 font-label-sm text-label-sm text-on-surface-variant underline-offset-2 transition duration-fast ease-standard hover:text-error hover:underline active:scale-[0.97]"
          >
            Reiniciar firma
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-xl border border-outline-variant bg-white p-3">
      <EncabezadoFirma titulo={titulo} subtitulo={subtitulo} />

      {/* Selector segmentado como el del mockup: la opción activa es una
          pastilla blanca sobre el gris. */}
      <div className="mb-3 flex justify-center gap-1 rounded-boton bg-surface-container p-1">
        <button
          type="button"
          onClick={() => {
            setModo('dibujar')
            setPreviewSubida(null)
            // El lienzo se monta de nuevo en blanco: sin esto, si antes se
            // había subido una imagen, "Confirmar firma" quedaba activo con el
            // lienzo vacío y al pulsarlo no hacía nada ni decía por qué.
            setVacio(true)
          }}
          className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-center text-[12px] [text-wrap:balance] font-medium leading-4 transition duration-fast ease-standard active:scale-[0.97] ${
            modo === 'dibujar' ? 'bg-white text-on-surface shadow-tarjeta' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Dibujar
        </button>
        <button
          type="button"
          onClick={() => {
            setModo('subir')
            limpiarLienzo()
          }}
          className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-center text-[12px] [text-wrap:balance] font-medium leading-4 transition duration-fast ease-standard active:scale-[0.97] ${
            modo === 'subir' ? 'bg-white text-on-surface shadow-tarjeta' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Subir imagen
        </button>
        <button
          type="button"
          onClick={() => {
            setModo('historico')
            limpiarLienzo()
            setPreviewSubida(null)
          }}
          className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-center text-[12px] [text-wrap:balance] font-medium leading-4 transition duration-fast ease-standard active:scale-[0.97] ${
            modo === 'historico' ? 'bg-white text-on-surface shadow-tarjeta' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Registro histórico
        </button>
      </div>

      {modo === 'dibujar' && (
        // touch-action: none evita que un trazo con el dedo se interprete
        // como scroll de la página en móvil (Fase 1.1).
        <div
          className="grid aspect-[5/2] w-full place-items-center overflow-hidden rounded-boton border border-dashed border-outline bg-white"
          style={{ touchAction: 'none' }}
        >
          <SignatureCanvas
            ref={sigCanvasRef}
            penColor="black"
            canvasProps={{ className: 'w-full h-full', style: { touchAction: 'none' } }}
            onEnd={() => setVacio(sigCanvasRef.current?.isEmpty() ?? true)}
          />
        </div>
      )}

      {modo === 'subir' && (
        <div className="grid aspect-[5/2] w-full place-items-center rounded-boton border border-dashed border-outline bg-white">
          {previewSubida ? (
            <img
              src={previewSubida}
              alt="Firma subida"
              className="max-h-full max-w-full object-contain p-2"
            />
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 font-label-sm text-label-sm text-on-surface-variant transition-colors duration-fast hover:text-on-surface">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-container-high text-on-surface">
                <Upload className="h-4.5 w-4.5" strokeWidth={1.75} />
              </span>
              Seleccionar imagen de firma
              <input type="file" accept="image/*" className="hidden" onChange={handleArchivo} />
            </label>
          )}
        </div>
      )}

      {modo === 'historico' && (
        <div className="grid aspect-[5/2] w-full place-items-center rounded-boton border border-dashed border-outline bg-surface-container-low px-4">
          <p className="font-label-sm text-label-sm text-on-surface-variant text-center text-pretty">
            Usa esta opción cuando el documento ya fue firmado en papel y solo se está migrando el
            registro al sistema (no hay trazo digital que capturar).
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        {modo === 'dibujar' ? (
          <button
            type="button"
            onClick={limpiarLienzo}
            className="rounded-boton px-2 py-1 font-label-sm text-label-sm text-on-surface-variant underline-offset-2 transition duration-fast ease-standard hover:text-error hover:underline active:scale-[0.97]"
          >
            Borrar trazo
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={modo !== 'historico' && vacio}
          className="inline-flex h-8 items-center justify-center rounded-boton bg-tinta px-3 text-[13px] font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-subtle disabled:shadow-none disabled:active:scale-100"
        >
          Confirmar firma
        </button>
      </div>
    </div>
  )
}

export default FirmaPad
