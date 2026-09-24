import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import { SkeletonFormulario } from '../components/Skeleton.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'
import { FORMATOS } from '../config/formatos.js'
import { listarDocumentosEntrega } from '../services/api.js'
import { formatearFecha } from '../utils/fecha.js'

function nombrePlanta(location) {
  if (location === 'Planta Tejar' || location === 'Planta Parramos') return location
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

/**
 * Cuántos equipos le quedan por devolver a una entrega. El listado ya trae
 * `pending_items_count` y `status` calculados por el backend, así que no hace
 * falta consultar los detalles de cada entrega: antes esta pantalla hacía una
 * llamada POR ENTREGA del colaborador solo para saber esto.
 *
 * Si esos campos no vinieran (backend más viejo), se asume que le queda equipo
 * pendiente: es preferible dejar entrar y que la hoja lo diga, a bloquear una
 * devolución que sí se puede hacer.
 */
function pendientesDe(entrega) {
  if (typeof entrega.pending_items_count === 'number') return entrega.pending_items_count
  if (entrega.status) return entrega.status === 'devuelto' ? 0 : 1
  return 1
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

  // Con una sola entrega no hace falta preguntar cuál: se salta directo a la
  // hoja de devolución -- salvo que ya esté devuelta por completo, en cuyo
  // caso se queda aquí y se explica por qué (antes se saltaba igual y el
  // usuario caía en una hoja que decía "ya no hay equipo pendiente").
  const unicaEntrega = entregasDelEmpleado.length === 1 ? entregasDelEmpleado[0] : null
  const unicaYaDevuelta = Boolean(unicaEntrega) && pendientesDe(unicaEntrega) === 0

  useEffect(() => {
    if (unicaEntrega && pendientesDe(unicaEntrega) > 0) {
      navigate(`/historial/entrega/${unicaEntrega.id}/devolucion`)
    }
  }, [unicaEntrega, navigate])

  return (
    <div className="flex-1 animate-view-in px-4 pt-6 pb-10 md:px-8 md:pt-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-stack-lg">
        <Link
          to="/historial/devolucion"
          className="inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Devolución de Equipo
        </Link>

        <div className="-mt-1 md:mt-0">
          <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
            <span aria-hidden="true" className="h-px w-7 bg-outline" />
            Historial / Devolución / Nueva
          </div>
          <h1 className="mt-1.5 font-display-lg text-titulo-movil text-on-surface md:text-display-lg">
            Registrar Devolución
          </h1>
          <p className="mt-1 max-w-2xl font-body-lg text-body-lg text-pretty text-on-surface-variant">
            Busca al colaborador que está devolviendo equipo. Solo aparecen quienes ya tienen una
            entrega registrada.
          </p>
        </div>

        {/* Tarjeta alineada a la izquierda (mismo borde que las listas), con
            su ancho de siempre. */}
        <div className="w-full max-w-2xl">
          {cargando ? (
            // Misma forma que la tarjeta con el buscador de responsable que
            // aparece al terminar de cargar, en vez de una rueda girando.
            <SkeletonFormulario campos={1} />
          ) : error ? (
            <div className="rounded-tarjeta bg-white shadow-tarjeta">
              <EstadoVacio variante="error" titulo="No se pudieron cargar las entregas" descripcion={error} />
            </div>
          ) : responsables.length === 0 ? (
            <div className="rounded-tarjeta bg-white shadow-tarjeta">
              <EstadoVacio
                icon={formato.icon}
                titulo="Todavía no hay entregas registradas"
                descripcion="Una devolución siempre nace de una entrega -- registra una primero."
                accion={
                  <Link
                    to="/actas/entrega/nueva"
                    className="inline-flex h-10 items-center justify-center rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97]"
                  >
                    Registrar una entrega
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="rounded-tarjeta bg-white p-4 shadow-tarjeta md:p-6">
              <div className="flex flex-col gap-2">
                <label className="text-meta font-semibold text-on-surface">Responsable</label>
                <SearchableSelect
                  options={responsables}
                  value={empleado}
                  onChange={setEmpleado}
                  placeholder="Busca por nombre..."
                  emptyOptionsText="No se encontró ningún responsable con ese nombre."
                />
              </div>

              {/* Más de una entrega: no se puede adivinar cuál se está
                  devolviendo -- se deja elegir. Una sola entrega que ya está
                  devuelta también se muestra aquí (con "Ya devuelta" y sin poder
                  abrirse), para que se entienda por qué no avanza. */}
              {(entregasDelEmpleado.length > 1 || unicaYaDevuelta) && (
                <div className="mt-stack-lg flex animate-pop-in flex-col gap-stack-sm border-t border-outline-variant pt-stack-lg">
                  <p className="font-body-md text-body-md font-semibold text-pretty text-on-surface">
                    {unicaEntrega
                      ? `La única entrega de ${empleado} ya fue devuelta por completo -- no le queda equipo pendiente`
                      : `${empleado} tiene ${entregasDelEmpleado.length} entregas registradas -- elige cuál se está devolviendo`}
                  </p>
                  {entregasDelEmpleado.map((entrega) => {
                    const pendientes = pendientesDe(entrega)
                    const yaDevuelta = pendientes === 0
                    return (
                      <button
                        key={entrega.id}
                        type="button"
                        disabled={yaDevuelta}
                        onClick={() => navigate(`/historial/entrega/${entrega.id}/devolucion`)}
                        className={`group flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-white px-4 py-3.5 text-left transition duration-base ease-standard ${
                          yaDevuelta
                            ? 'cursor-not-allowed bg-surface-container-low opacity-60'
                            : 'hover:-translate-y-px hover:border-outline hover:shadow-flotante active:scale-[0.99]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-body-md text-body-md font-medium text-on-surface">
                              {formatearFecha(entrega.delivery_date)} · {nombrePlanta(entrega.location)}
                            </p>
                            {yaDevuelta ? (
                              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-high px-2.5 text-meta font-medium text-on-surface-variant">
                                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-outline" />
                                Ya devuelta
                              </span>
                            ) : (
                              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-outline-variant bg-white px-2.5 text-meta font-medium text-on-surface">
                                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-assigned" />
                                {pendientes} pendiente{pendientes === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 font-mono text-micro tabular-nums text-on-surface-variant">
                            {entrega.items_count ?? (Array.isArray(entrega.items) ? entrega.items.length : 0)} equipo(s) en
                            esta entrega
                          </p>
                        </div>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-outline transition duration-base ease-standard group-hover:translate-x-0.5 group-hover:text-on-surface"
                          strokeWidth={2}
                        />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuscarDevolucion
