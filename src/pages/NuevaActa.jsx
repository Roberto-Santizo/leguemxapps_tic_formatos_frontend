import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { LISTA_FORMATOS } from '../config/formatos.js'

// "Devolución de Equipo" ya no se llena desde una hoja en blanco: una
// devolución siempre nace de una entrega real, así que su tarjeta lleva a
// buscar al responsable (BuscarDevolucion.jsx) en vez de a /actas/:tipo/nueva
// como las demás -- ahí se resuelve a qué entrega corresponde y se abre la
// hoja ya con los datos completos.
function rutaDeFormato(formato) {
  return formato.id === 'devolucion' ? '/historial/devolucion/nueva' : `/actas/${formato.id}/nueva`
}

/**
 * Pantalla de inicio del sistema (ruta "/").
 *
 * Antes esta ruta abría directamente la Hoja de Devolución. Ahora los seis
 * formatos físicos existen en el sistema, así que el inicio es el selector:
 * una tarjeta por formato.
 */
function NuevaActa() {
  return (
    <div className="flex-1 animate-view-in p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">Nueva Acta</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Selecciona el formato que vas a levantar. Cada uno reproduce la hoja física del
            Departamento de Tecnologías de la Información.
          </p>
        </div>

        {/* Solo 2 formatos activos hoy -- grilla fluida en vez de un tope fijo
            de columnas, mismo motivo que Historial.jsx: con solo 2 tarjetas,
            xl:grid-cols-3 dejaba una tercera columna vacía y las tarjetas se
            veían chicas y descuadradas. Márgenes, separación, radio, título y
            encabezado son los mismos de Catalogo.jsx (la pantalla de
            referencia): antes esta pantalla tenía los suyos propios. */}
        <div className="grid gap-stack-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {LISTA_FORMATOS.map((formato) => {
            const Icon = formato.icon
            return (
              <Link
                key={formato.id}
                to={rutaDeFormato(formato)}
                className="group flex flex-col gap-stack-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm transition-all duration-150 hover:border-outline hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-outline-variant bg-surface-container-lowest text-primary transition-colors group-hover:border-outline">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <span className="font-mono text-label-sm tracking-wide text-on-surface-variant">
                    {formato.codigo}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                    {formato.tituloCorto}
                  </h2>
                  <p className="font-body-md text-body-md text-pretty text-on-surface-variant">
                    {formato.descripcion}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant pt-3">
                  <span className="font-label-bold text-label-bold text-on-surface-variant">
                    {formato.meta}
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

export default NuevaActa
