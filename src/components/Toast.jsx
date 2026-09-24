import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
 * Posición (sistema Sierra): arriba a la derecha desde `sm:` (como el
 * mockup; desde `md:` alineado con el borde derecho del carril de 1200px de
 * listas y formularios -- 32px de padding del <main> + su canal de scroll de
 * 10px, y `50vw − 715px` cuando el carril se centra -- y a la altura del
 * botón volver)
 * y ABAJO en móvil, a lo ancho con 12px de margen: arriba tapaba el botón
 * "volver" justo después de guardar y el toque solo cerraba el aviso.
 *
 * Hojas con barra de acciones fija (`data-barra-inferior`, las 4 hojas): en
 * TODOS los tamaños el aviso va 12px por encima de la barra y, desde md:,
 * alineado con sus botones (arriba tapaba el eyebrow de la hoja). La barra
 * mide 64, 90, 112 o 116px según el ancho, cuántos botones tenga y si
 * muestra un error de validación, así que no se adivina en CSS: mientras hay
 * avisos, un ResizeObserver mide la barra y escribe su alto y su borde
 * derecho como variables CSS en ESTE contenedor (`--alto-barra`,
 * `--derecha-barra`) y le pone `data-sobre-barra`; index.css hace el resto.
 * Es puramente visual: no toca estado de React ni el de las páginas, y un
 * MutationObserver sigue a la barra si aparece/desaparece con el aviso
 * visible (p. ej. al aterrizar en la vista tras registrar). Funciona también
 * sin `:has()`. Con el cajón móvil abierto, index.css lo mete dentro del
 * cajón, sobre "Cerrar Sesión".
 * Entra con `toastIn` (desde arriba a la derecha) en escritorio y con
 * `toastInAbajo` (sube desde el pie) en móvil y sobre la barra de las hojas. El éxito va en pastilla
 * negra de tinta; el error, en blanco con filete e ícono rojos.
 */
export function Toaster() {
  const [lista, setLista] = useState(avisos)
  const contenedor = useRef(null)
  const hayAvisos = lista.length > 0

  useEffect(() => {
    suscriptores.add(setLista)
    setLista(avisos)
    return () => {
      suscriptores.delete(setLista)
    }
  }, [])

  // Posición sobre la barra fija de las hojas (solo estilo; ver arriba).
  useLayoutEffect(() => {
    const caja = contenedor.current
    // Sin ResizeObserver (navegador muy viejo) el aviso queda en su lugar por defecto.
    if (!hayAvisos || !caja || typeof ResizeObserver === 'undefined') return undefined
    let barra = null
    const medir = () => {
      if (!barra) return
      const botones = barra.firstElementChild || barra
      caja.style.setProperty('--alto-barra', `${barra.offsetHeight}px`)
      caja.style.setProperty('--derecha-barra', `${Math.max(0, window.innerWidth - botones.getBoundingClientRect().right)}px`)
    }
    const observador = new ResizeObserver(medir)
    const seguir = () => {
      const actual = document.querySelector('[data-barra-inferior]')
      if (actual === barra) return
      if (barra) observador.unobserve(barra)
      barra = actual
      if (barra) {
        observador.observe(barra)
        caja.setAttribute('data-sobre-barra', '')
        medir()
      } else {
        caja.removeAttribute('data-sobre-barra')
      }
    }
    seguir()
    const vigia = new MutationObserver(seguir)
    vigia.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', medir)
    return () => {
      observador.disconnect()
      vigia.disconnect()
      window.removeEventListener('resize', medir)
    }
  }, [hayAvisos])

  if (!hayAvisos) return null

  return (
    <div
      ref={contenedor}
      data-toaster
      className="pointer-events-none fixed inset-x-3 bottom-[calc(16px+env(safe-area-inset-bottom))] z-[70] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-[calc(theme(spacing.barra-movil)+12px)] sm:items-end md:right-[max(42px,calc(50vw_-_715px))] md:top-10"
    >
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
              'animate-toast-in-abajo sm:animate-toast-in pointer-events-auto flex w-full cursor-pointer items-center gap-2.5 rounded-aviso py-1.5 pl-4 pr-1.5 shadow-toast transition-colors duration-fast ease-standard sm:w-auto sm:max-w-[400px]',
              esError
                ? 'bg-surface-container-lowest text-on-surface ring-1 ring-error/40 hover:bg-error-container/30'
                : 'bg-tinta text-on-primary hover:bg-tinta-hover',
            ].join(' ')}
          >
            <Icono
              className={`h-4 w-4 shrink-0 animate-icon-pop ${esError ? 'text-error' : 'text-on-primary'}`}
              strokeWidth={1.75}
            />
            <p className="flex-1 py-1.5 font-body-md text-body-md font-medium break-words">{aviso.mensaje}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                quitarAviso(aviso.id)
              }}
              aria-label="Cerrar aviso"
              className={[
                'grid h-8 w-8 shrink-0 place-items-center rounded-full transition-[transform,background-color,color] duration-fast ease-standard active:scale-[0.90]',
                esError
                  ? 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  : 'text-on-primary/70 hover:bg-on-primary/15 hover:text-on-primary',
              ].join(' ')}
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default Toaster
