import { Link } from 'react-router-dom'
import { Tag, Building2, HardDrive, Users, ChevronRight } from 'lucide-react'

/**
 * Landing de la sección Catálogo: los datos maestros que alimentan los
 * formularios de actas. Visible para cualquier usuario autenticado -- las
 * rutas /brands y /departments de Laravel solo exigen jwt.auth, sin rol.
 *
 * Tarjetas de selección "Sierra": blancas, rounded-tarjeta + shadow-tarjeta,
 * ícono en caja gris cálida, mismo patrón que Nueva Acta e Historial.
 */

const SECCIONES = [
  {
    to: '/catalogo/marcas',
    icon: Tag,
    titulo: 'Marcas',
    descripcion: 'Fabricantes de equipo que aparecen en la columna Marca de cada acta.',
  },
  {
    to: '/catalogo/departamentos',
    icon: Building2,
    titulo: 'Departamentos',
    descripcion: 'Áreas de la empresa que se asignan al colaborador en cada acta.',
  },
  {
    to: '/catalogo/equipos',
    icon: HardDrive,
    titulo: 'Equipos',
    descripcion: 'Inventario de equipo y las características técnicas de cada uno.',
  },
  {
    to: '/catalogo/empleados',
    icon: Users,
    titulo: 'Empleados',
    descripcion: 'Colaboradores registrados y su departamento asignado.',
  },
]

function Catalogo() {
  return (
    <div className="flex-1 animate-view-in p-container-padding md:p-stack-lg">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <div>
          <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
            <span aria-hidden="true" className="h-px w-7 bg-outline" />
            Legumex / Catálogo
          </div>
          <h1 className="mt-1.5 font-display-lg text-[26px] leading-[32px] font-extrabold tracking-[-0.04em] text-on-surface md:text-display-lg">
            Catálogo
          </h1>
          <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
            Datos maestros que alimentan los formularios de actas.
          </p>
        </div>

        {/* Grilla fluida (mismo patrón que ya usa SkeletonDetalle en
            Skeleton.jsx): cada tarjeta nunca baja de 280px, así que en vez de
            un ancho tope fijo (que dejaba un hueco vacío en pantallas anchas)
            o de saltar a 4 columnas apretadas, el número de columnas se
            acomoda solo al ancho real disponible. */}
        <div className="grid gap-stack-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {SECCIONES.map((seccion, i) => {
            const Icon = seccion.icon
            return (
              <Link
                key={seccion.to}
                to={seccion.to}
                data-reveal
                className="group flex flex-col gap-stack-md rounded-tarjeta bg-white p-4 shadow-tarjeta transition duration-base ease-standard hover:-translate-y-0.5 hover:shadow-flotante active:scale-[0.99] md:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surface-container-high text-on-surface transition-colors duration-base ease-standard group-hover:bg-surface-container-highest">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  {/* Número de sección: solo decorativo, como el código de
                      formato de las tarjetas de Nueva Acta. */}
                  <span
                    aria-hidden="true"
                    className="inline-flex h-6 items-center rounded-full border border-outline-variant bg-white px-2.5 font-mono text-[11px] tracking-[0.1em] text-on-surface-variant"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                    {seccion.titulo}
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {seccion.descripcion}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant pt-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">
                    Listar · Crear · Editar
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

export default Catalogo
