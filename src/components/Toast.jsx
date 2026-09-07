import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'

/**
 * Avisos breves de "ya quedó" / "no se pudo", el único punto del sistema que
 * confirma al usuario que una escritura terminó bien.
 *
 * Se diseñó como un store a nivel de módulo y NO como un contexto de React a
 * propósito: así cualquier pantalla llama `mostrarToast(...)` con un import
 * normal, sin envolver el árbol de rutas ni pasar props por en medio. La
 * estructura de la app (App.jsx, rutas, layouts) queda intacta; lo único que
 * se monta es <Toaster /> una sola vez en AppLayout.
 *
 * Uso:
 *   import { mostrarToast } from '../components/Toast.jsx'
 *   mostrarToast('Entrega registrada')
 *   mostrarToast('No se pudo eliminar', { tipo: 'error' })
 *
 * Regla de la paleta del sistema: el rojo es exclusivo de errores, así que el
 * aviso de éxito va en tinta neutra -- no se inventa un verde que no existe
 * en los tokens.
 */

let idSiguiente = 1
let avisos = []
const suscriptores = new Set()

function emitir() {
  // Copia nueva en cada emisión para que React detecte el cambio.
  avisos = [...avisos]
  suscriptores.forEach((notificar) => notificar(avisos))
}

function quitarAviso(id) {
  avisos = avisos.filter((a) => a.id !== id)
  emitir()
}

/**
 * @param {string} mensaje  Texto corto, en lenguaje de negocio.
 * @param {{ tipo?: 'exito' | 'error', duracion?: number }} opciones
 *        duracion en ms; 0 deja el aviso hasta que el usuario lo cierre.
 * @returns {number} id del aviso, por si se quiere cerrar a mano.
 */
export function mostrarToast(mensaje, { tipo = 'exito', duracion = 4000 } = {}) {
  if (!mensaje) return null
  const id = idSiguiente
  idSiguiente += 1
  avisos = [...avisos, { id, mensaje, tipo }]
  emitir()
  if (duracion > 0) {
    setTimeout(() => quitarAviso(id), duracion)
  }
  return id
}

export function cerrarToast(id) {
  quitarAviso(id)
}

/**
 * Contenedor visual. Se monta UNA sola vez, en AppLayout.
 *
 * Posición: en móvil se coloca por encima de la barra de acciones fija que
 * usan los formatos de acta (sticky bottom-0, ~68px de alto), para no taparle
 * el botón de guardar al usuario justo cuando acaba de guardar. En escritorio
 * se ancla abajo a la derecha.
 */
export function Toaster() {
  const [lista, setLista] = useState(avisos)

  useEffect(() => {
    suscriptores.add(setLista)
    setLista(avisos)
    return () => {
      suscriptores.delete(setLista)
    }
  }, [])

  if (lista.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end">
      {lista.map((aviso) => {
        const esError = aviso.tipo === 'error'
        const Icono = esError ? AlertTriangle : CheckCircle2
        return (
          <div
            key={aviso.id}
            role="status"
            aria-live="polite"
            onClick={() => quitarAviso(aviso.id)}
            className={[
              'animate-view-in pointer-events-auto flex w-full cursor-pointer items-start gap-3 rounded-xl border bg-surface-container-lowest px-4 py-3 shadow-lg transition-colors sm:w-80',
              esError
                ? 'border-error/30 hover:bg-error-container/30'
                : 'border-outline-variant hover:bg-surface-container-low',
            ].join(' ')}
          >
            <Icono
              className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${esError ? 'text-error' : 'text-on-surface'}`}
              strokeWidth={2}
            />
            <p className="flex-1 font-body-md text-body-md text-on-surface break-words">{aviso.mensaje}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                quitarAviso(aviso.id)
              }}
              aria-label="Cerrar aviso"
              className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default Toaster
