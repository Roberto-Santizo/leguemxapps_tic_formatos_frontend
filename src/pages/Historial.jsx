import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { LISTA_FORMATOS } from '../config/formatos.js'

/**
 * Landing de Historial de Actas: una tarjeta por cada uno de los seis
 * formatos físicos, igual patrón que Catalogo.jsx. Cada una lleva a
 * /historial/:tipo -- "Entrega de Equipo" y "Devolución de Equipo" ya
 * tienen datos reales; las otras cuatro muestran "Próximamente" hasta que
 * el backend exponga sus endpoints.
 */
function Historial() {
  return (
    <div className="flex-1 animate-view-in p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">
            Historial de Actas
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Elige el formato para ver, buscar y eliminar las actas ya registradas.
          </p>
        </div>

        {/* Solo 2 formatos activos hoy -- una grilla fluida en vez de un tope
            fijo de columnas evita que quede una tercera columna vacía (como
            pasaba antes con 3 tarjetas en xl:grid-cols-3) y las tarjetas se
            ven más grandes al tener todo el ancho disponible para repartirse
            entre solo dos. */}
        <div className="grid gap-column-gap" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {LISTA_FORMATOS.map((formato) => {
            const Icon = formato.icon
            return (
              <Link
                key={formato.id}
                to={`/historial/${formato.id}`}
                className="group flex flex-col gap-stack-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-7 shadow-sm transition-all duration-150 hover:border-outline hover:shadow-md active:scale-[0.99]"
              >
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-outline-variant bg-surface-container-lowest text-primary transition-colors group-hover:border-outline">
                  <Icon className="h-7 w-7" strokeWidth={2} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                    {formato.tituloCorto}
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {formato.descripcionHistorial || formato.descripcion}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant pt-3">
                  <span className="font-label-bold text-label-bold text-on-surface-variant">
                    {formato.id === 'entrega'
                      ? 'Buscar · Ver · Eliminar'
                      : formato.id === 'devolucion'
                        ? 'Buscar · Ver'
                        : 'Próximamente'}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-outline transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Historial
