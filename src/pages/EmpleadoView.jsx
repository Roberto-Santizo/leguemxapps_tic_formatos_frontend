import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, HardDrive, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import { SkeletonDetalle } from '../components/Skeleton.jsx'
import { obtenerEmpleado, listarDepartamentos, equiposDeEmpleado } from '../services/api.js'
import { formatearFecha } from '../utils/fecha.js'

function nombrePlanta(location) {
  if (location === 'Planta Tejar' || location === 'Planta Parramos') return location
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

/**
 * Vista de solo lectura de un empleado -- destino de tocar la tarjeta en móvil
 * (o el ojo en escritorio), igual que EquipoView. "Editar" pide confirmación y,
 * al aceptar, navega a /catalogo/empleados/:id.
 *
 * Carga el registro por su id contra la API. Antes usaba los datos que le
 * pasaba la lista al navegar (`location.state`), así que al recargar la página
 * o al abrir la dirección directa mostraba "No hay información para mostrar" --
 * además de incumplir la regla del proyecto de cargar siempre por id.
 *
 * Muestra también el equipo que la persona tiene en este momento
 * (GET /employees/{id}/equipments): son los equipos de sus entregas que
 * todavía no se devolvieron, y cada uno enlaza con el acta de la que salió.
 */
function EmpleadoView() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [empleado, setEmpleado] = useState(null)
  const [departamentos, setDepartamentos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [errorEquipos, setErrorEquipos] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Sube con "Reintentar" para volver a pedir el empleado tras un error.
  const [intento, setIntento] = useState(0)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    setError('')
    setErrorEquipos(false)
    Promise.all([
      obtenerEmpleado(token, Number(id)),
      // El nombre del departamento no viene en el empleado (solo su id), así
      // que se resuelve contra el catálogo, igual que en la lista.
      listarDepartamentos(token).catch(() => []),
      // Si falla solo esto, la pantalla igual sirve: se avisa dentro de su
      // sección en vez de tumbar todo el detalle.
      equiposDeEmpleado(token, Number(id)).catch(() => {
        if (vivo) setErrorEquipos(true)
        return []
      }),
    ])
      .then(([emp, deptos, asignados]) => {
        if (!vivo) return
        // Este endpoint NO responde 404 cuando el id no existe: contesta "todo
        // bien" con el dato vacío. Sin esta comprobación, la pantalla quedaría
        // en blanco al entrar a un empleado borrado o con un id mal escrito.
        if (!emp) {
          setError('No existe un empleado con ese identificador.')
          return
        }
        setEmpleado(emp)
        setDepartamentos(Array.isArray(deptos) ? deptos : [])
        setEquipos(Array.isArray(asignados) ? asignados : [])
      })
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el empleado'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [id, token, intento])

  const departamento = empleado
    ? empleado.department || departamentos.find((d) => d.id === empleado.department_id)?.name || '—'
    : '—'

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[600px] mx-auto flex flex-col gap-stack-md">
        <Link
          to="/catalogo/empleados"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest active:scale-[0.97] transition-transform"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Empleados
        </Link>

        {cargando ? (
          <SkeletonDetalle secciones={2} camposPorSeccion={2} />
        ) : error ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <EstadoVacio
              variante="error"
              titulo="No se pudo cargar el empleado"
              descripcion={error}
              accion={
                <button
                  type="button"
                  onClick={() => setIntento((n) => n + 1)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
                >
                  Reintentar
                </button>
              }
            />
          </div>
        ) : (
          <>
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
                  <p className="font-body-md text-body-md text-on-surface">{empleado.code || '—'}</p>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Departamento</p>
                  <p className="font-body-md text-body-md text-on-surface">{departamento}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-on-surface mb-4">
                <HardDrive className="h-5 w-5 shrink-0 text-primary" strokeWidth={2} />
                {equipos.length > 0 ? `Equipo en su poder (${equipos.length})` : 'Equipo en su poder'}
              </h2>

              {errorEquipos ? (
                <p className="font-label-sm text-label-sm text-error">
                  No se pudo cargar el equipo asignado. Vuelve a entrar para intentarlo de nuevo.
                </p>
              ) : equipos.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  No tiene equipo asignado en este momento.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-outline-variant">
                  {equipos.map((eq) => (
                    <li
                      key={eq.delivery_document_detail_id}
                      className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="font-label-bold text-label-bold text-on-surface break-words">
                          {eq.equipment_name || '—'}
                        </p>
                        <p className="font-body-md text-body-md text-on-surface-variant break-words">
                          {[eq.equipment_brand, eq.equipment_model].filter(Boolean).join(' · ') || '—'}
                          {eq.equipment_serie ? ` · Serie ${eq.equipment_serie}` : ''}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          Entregado el {formatearFecha(eq.delivery_date)} · {nombrePlanta(eq.location)}
                        </p>
                        {eq.observations && (
                          <p className="font-label-sm text-label-sm text-on-surface-variant break-words">
                            {eq.observations}
                          </p>
                        )}
                      </div>
                      <Link
                        to={`/historial/entrega/${eq.delivery_document_id}`}
                        className="shrink-0 rounded-full border border-outline-variant px-2.5 py-1 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.90] transition-transform"
                      >
                        Ver entrega #{eq.delivery_document_id}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo="Editar empleado"
        mensaje={empleado ? `¿Desea editar a "${empleado.name}"?` : ''}
        textoConfirmar="Sí, editar"
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => navigate(`/catalogo/empleados/${id}`)}
      />
    </div>
  )
}

export default EmpleadoView
