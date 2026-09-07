import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'
import { FORMATOS } from '../config/formatos.js'
import { listarDocumentosEntrega } from '../services/api.js'

function nombrePlanta(location) {
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

const formato = FORMATOS.devolucion

/**
 * Puerta de entrada a una devolución por nombre del responsable (en vez de
 * partir del detalle de una entrega puntual). Solo deja elegir entre
 * colaboradores que YA tienen alguna entrega registrada -- una devolución
 * siempre nace de una entrega, así que no tiene sentido ofrecer a nadie más.
 *
 * Una devolución no puede mezclar equipo de dos entregas distintas (la API
 * la amarra a un solo delivery_document_id), así que si el responsable
 * elegido tiene más de una entrega, se le pide elegir cuál está
 * devolviendo antes de abrir la hoja.
 */
function BuscarDevolucion() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [entregas, setEntregas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [empleado, setEmpleado] = useState('')

  useEffect(() => {
    let vivo = true
    setCargando(true)
    setError('')
    listarDocumentosEntrega(token)
      .then((data) => vivo && setEntregas(Array.isArray(data) ? data : []))
      .catch((err) => vivo && setError(err.message || 'No se pudieron cargar las entregas'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [token])

  // Solo responsables que ya tienen al menos una entrega -- se identifican
  // por nombre porque el listado de entregas no trae employee_id.
  const responsables = useMemo(() => {
    const nombres = [...new Set(entregas.map((e) => e.employee_name).filter(Boolean))]
    return nombres.map((nombre) => ({ id: nombre, name: nombre }))
  }, [entregas])

  const entregasDelEmpleado = useMemo(
    () => (empleado ? entregas.filter((e) => e.employee_name === empleado) : []),
    [entregas, empleado],
  )

  // Con una sola entrega no hace falta preguntar cuál: se salta directo a
  // la hoja de devolución de esa entrega.
  useEffect(() => {
    if (entregasDelEmpleado.length === 1) {
      navigate(`/historial/entrega/${entregasDelEmpleado[0].id}/devolucion`)
    }
  }, [entregasDelEmpleado, navigate])

  return (
    <div className="flex-1 animate-view-in p-container-padding md:p-8">
      <div className="mx-auto max-w-2xl space-y-stack-lg">
        <Link
          to="/historial/devolucion"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Devolución de Equipo
        </Link>

        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">
            Registrar Devolución
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Busca al colaborador que está devolviendo equipo. Solo aparecen quienes ya tienen una
            entrega registrada.
          </p>
        </div>

        {cargando ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-14 justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-outline" strokeWidth={2} />
            <span className="font-body-md text-body-md text-on-surface-variant">Cargando entregas...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <EstadoVacio variante="error" titulo="No se pudieron cargar las entregas" descripcion={error} />
          </div>
        ) : responsables.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <EstadoVacio
              icon={formato.icon}
              titulo="Todavía no hay entregas registradas"
              descripcion="Una devolución siempre nace de una entrega -- registra una primero."
              accion={
                <Link
                  to="/actas/entrega/nueva"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  Registrar una entrega
                </Link>
              }
            />
          </div>
        ) : (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-bold text-label-bold text-on-surface">Responsable</label>
              <SearchableSelect
                options={responsables}
                value={empleado}
                onChange={setEmpleado}
                placeholder="Busca por nombre..."
                emptyOptionsText="No se encontró ningún responsable con ese nombre."
              />
            </div>

            {/* Más de una entrega: no se puede adivinar cuál se está
                devolviendo -- se deja elegir. */}
            {entregasDelEmpleado.length > 1 && (
              <div className="mt-stack-lg flex flex-col gap-stack-sm">
                <p className="font-label-bold text-label-bold text-on-surface">
                  {empleado} tiene {entregasDelEmpleado.length} entregas registradas -- elige cuál se está
                  devolviendo
                </p>
                {entregasDelEmpleado.map((entrega) => (
                  <button
                    key={entrega.id}
                    type="button"
                    onClick={() => navigate(`/historial/entrega/${entrega.id}/devolucion`)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3.5 text-left transition-colors hover:bg-surface-container-high"
                  >
                    <div className="min-w-0">
                      <p className="font-body-md text-body-md font-medium text-on-surface">
                        {entrega.delivery_date || '—'} · {nombrePlanta(entrega.location)}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">
                        {Array.isArray(entrega.items) ? entrega.items.length : 0} equipo(s) en esta entrega
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-outline" strokeWidth={2} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BuscarDevolucion
