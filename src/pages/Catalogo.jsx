import { Link } from 'react-router-dom'
import { Tag, Building2, HardDrive, Users, ChevronRight } from 'lucide-react'

/**
 * Landing de la sección Catálogo: los datos maestros que alimentan los
 * formularios de actas. Visible para cualquier usuario autenticado -- las
 * rutas /brands y /departments de Laravel solo exigen jwt.auth, sin rol.
 *
 * Reutiliza el patrón de tarjeta de EnConstruccion.jsx (ícono en círculo
 * secondary-container, borde outline-variant, superficie lowest).
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
    <div className="flex-1 animate-view-in p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">Catálogo</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Datos maestros que alimentan los formularios de actas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-column-gap sm:grid-cols-2 lg:grid-cols-4">
          {SECCIONES.map((seccion) => {
            const Icon = seccion.icon
            return (
              <Link
                key={seccion.to}
                to={seccion.to}
                className="group flex flex-col gap-stack-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm transition-all duration-150 hover:border-outline hover:shadow-md active:scale-[0.99]"
              >
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary-container text-on-secondary-container">
                  <Icon className="h-6 w-6" strokeWidth={2} />
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
                  <span className="font-label-bold text-label-bold text-on-surface-variant">
                    Listar · Crear · Editar
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

export default Catalogo
