import { Link } from 'react-router-dom'
import { ArrowLeft, SearchX } from 'lucide-react'
import SierraFondo from '../components/SierraFondo.jsx'

// Se muestra cuando la URL no coincide con ninguna ruta conocida (Fase 4).
// En vez de dejar una pantalla en blanco (comportamiento anterior) o
// redirigir en silencio, se avisa explícitamente y se ofrece un botón para
// volver al inicio.
//
// Va fuera de AppLayout, así que pinta su propio papel + cordillera
// (SierraFondo, decorativa) y deja el aviso en una tarjeta blanca centrada,
// con el código de error en mono como el resto de estados del sistema.
function NotFound() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-papel font-body-lg">
      <SierraFondo />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="animate-card-rise w-full max-w-sm rounded-tarjeta bg-white p-6 text-center shadow-flotante sm:p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-surface-container-high text-on-surface">
              <SearchX className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
              <span aria-hidden="true" className="h-px w-7 bg-outline" />
              Error 404
              <span aria-hidden="true" className="h-px w-7 bg-outline" />
            </div>
            <h1 className="-mt-1 font-headline-lg text-headline-lg text-on-surface">Página no encontrada</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              La dirección a la que intentaste entrar no existe o ya no está disponible.
            </p>
            <Link
              to="/"
              className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-boton bg-tinta px-6 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97] sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
