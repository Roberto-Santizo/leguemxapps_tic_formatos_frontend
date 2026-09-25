import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import CatalogoRegistroView from '../components/CatalogoRegistroView.jsx'
import { obtenerDepartamento } from '../services/api.js'
import { FORMATOS } from '../config/formatos.js'

const TEXTOS = {
  titulo: 'Departamentos',
  tituloEditar: 'Editar departamento',
  colNombre: 'Departamento',
}

// Tarjetas de historial del departamento: llevan a las mismas listas del
// Historial de actas, filtradas a este departamento
// (DepartamentoHistorial.jsx). Mismo estilo que las tarjetas de Historial.
function HistorialDelDepartamento(departamento) {
  const tarjetas = [
    {
      tipo: 'entrega',
      icono: FORMATOS.entrega.icon,
      titulo: 'Historial de entregas',
      descripcion: `Equipo entregado a colaboradores de ${departamento.name}.`,
    },
    {
      tipo: 'devolucion',
      icono: FORMATOS.devolucion.icon,
      titulo: 'Historial de devoluciones',
      descripcion: `Equipo que devolvieron colaboradores de ${departamento.name}.`,
    },
  ]

  return (
    <section aria-labelledby="historial-depto" className="flex flex-col gap-stack-md">
      <h2 id="historial-depto" className="font-headline-md text-headline-md font-bold text-on-surface">
        Historial del departamento
      </h2>
      <div className="grid gap-stack-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {tarjetas.map(({ tipo, icono: Icono, titulo, descripcion }) => (
          <Link
            key={tipo}
            to={`/catalogo/departamentos/${departamento.id}/historial/${tipo}`}
            className="group flex flex-col gap-stack-md rounded-tarjeta bg-white p-4 shadow-tarjeta transition duration-base ease-standard hover:-translate-y-0.5 hover:shadow-flotante active:scale-[0.99] md:p-5"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-container-high text-on-surface transition-colors duration-base ease-standard group-hover:bg-surface-container-highest">
              <Icono className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-headline-md text-headline-md text-on-surface">{titulo}</h3>
              <p className="break-words font-body-md text-body-md text-on-surface-variant">{descripcion}</p>
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant pt-3">
              <span className="font-mono text-micro uppercase tracking-[0.1em] text-on-surface-variant">
                Filtrar · Exportar CSV
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-outline transition duration-base ease-standard group-hover:translate-x-0.5 group-hover:text-on-surface"
                strokeWidth={1.75}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function DepartamentosView() {
  return (
    <CatalogoRegistroView
      textos={TEXTOS}
      onObtener={obtenerDepartamento}
      rutaBase="/catalogo/departamentos"
      extra={HistorialDelDepartamento}
    />
  )
}

export default DepartamentosView
