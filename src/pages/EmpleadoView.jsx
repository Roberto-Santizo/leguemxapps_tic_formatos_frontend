import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

/**
 * Vista de solo lectura de un empleado -- destino de tocar la tarjeta en
 * móvil (o el ojo en escritorio), igual que EquipoView. "Editar" pide
 * confirmación y, al aceptar, navega a /catalogo/empleados/:id.
 */
function EmpleadoView() {
  const location = useLocation()
  const navigate = useNavigate()
  const [confirmando, setConfirmando] = useState(false)

  const empleado = location.state?.empleado

  if (!empleado) {
    return (
      <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
        <div className="max-w-[800px] mx-auto flex flex-col gap-stack-md">
          <Link
            to="/catalogo/empleados"
            className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Empleados
          </Link>
          <p className="font-body-md text-body-md text-on-surface-variant">
            No hay información para mostrar. Vuelve a la lista e inténtalo de nuevo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[800px] mx-auto flex flex-col gap-stack-md">
        <Link
          to="/catalogo/empleados"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Empleados
        </Link>

        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">{empleado.name}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Información completa del empleado.</p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
            Editar
          </button>
        </div>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-4">Datos del empleado</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <div>
              <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Código</p>
              <p className="font-body-md text-body-md text-on-surface">{empleado.code}</p>
            </div>
            <div>
              <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Departamento</p>
              <p className="font-body-md text-body-md text-on-surface">{empleado.departamentoNombre}</p>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo="Editar empleado"
        mensaje={`¿Desea editar a "${empleado.name}"?`}
        textoConfirmar="Sí, editar"
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => navigate(`/catalogo/empleados/${empleado.id}`)}
      />
    </div>
  )
}

export default EmpleadoView
