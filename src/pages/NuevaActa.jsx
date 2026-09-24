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
    <div className="flex-1 animate-view-in p-container-padding md:p-stack-lg">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <div>
          <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
            <span aria-hidden="true" className="h-px w-7 bg-outline" />
            Actas / Nueva
          </div>
          <h1 className="mt-1.5 font-display-lg text-[26px] leading-[32px] font-extrabold tracking-[-0.04em] text-on-surface md:text-display-lg">
            Nueva Acta
          </h1>
          <p className="mt-1 max-w-3xl font-body-lg text-body-lg text-pretty text-on-surface-variant">
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
                data-reveal
                className="group flex flex-col gap-stack-md rounded-tarjeta bg-white p-4 shadow-tarjeta transition duration-base ease-standard hover:-translate-y-0.5 hover:shadow-flotante active:scale-[0.99] md:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surface-container-high text-on-surface transition-colors duration-base ease-standard group-hover:bg-surface-container-highest">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <span className="inline-flex h-6 items-center rounded-full border border-outline-variant bg-white px-2.5 font-mono text-[11px] tracking-[0.1em] text-on-surface-variant">
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
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">
                    {formato.meta}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-outline transition duration-base ease-standard group-hover:translate-x-0.5 group-hover:text-on-surface"
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
