import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Pencil, Plus, Loader2, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Buscador from '../components/Buscador.jsx'
import { CaracteristicasDeEquipo } from '../components/CaracteristicasEditor.jsx'
import {
  listarEquipos,
  listarCaracteristicas,
  obtenerCaracteristicasDeEquipo,
  crearCaracteristica,
  actualizarCaracteristica,
} from '../services/api.js'

/**
 * Lista de equipos (GET /equipments) con sus dos estados por fila:
 *
 *   Estado A -- sin características: texto "No contiene características",
 *   ojo y lápiz deshabilitados (mismo gris de inactivo del resto del
 *   sistema: text-on-surface-variant + opacity-55 + cursor-not-allowed) y un
 *   botón "+" como única entrada para empezar a agregarlas.
 *
 *   Estado B -- con características: ojo activo (vista rápida de solo
 *   lectura, desplegada en la misma tabla) y lápiz activo (vista completa
 *   de edición en /catalogo/equipos/:id).
 *
 * En cuanto se guarda la primera característica de un equipo del Estado A,
 * la fila pasa sola al Estado B: desaparece el "+" y se activan los íconos.
 *
 * Responsive, igual que CatalogoLista: tabla en md: y superior, tarjetas
 * apiladas debajo de md. En móvil no hay dos íconos -- se toca la tarjeta
 * completa y se despliega ahí mismo la lista (o el formulario de alta).
 */

function EquiposList() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [equipos, setEquipos] = useState([])
  const [conteos, setConteos] = useState({}) // equipmentId -> nº de características
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Fila desplegada: solo para el alta ("+"); el ojo ahora navega a
  // /catalogo/equipos/:id/ver, la vista completa del equipo.
  const [abierta, setAbierta] = useState(null)
  const [detalle, setDetalle] = useState([])
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      const [lista, caracts] = await Promise.all([
        listarEquipos(token),
        listarCaracteristicas(token).catch(() => []),
      ])
      const equiposLista = Array.isArray(lista) ? lista : []
      setEquipos(equiposLista)

      // El listado de características trae el NOMBRE del equipo, no su id
      // (así está documentado), así que el conteo se arma por nombre y se
      // traduce a id con la lista de equipos.
      const porNombre = {}
      for (const c of Array.isArray(caracts) ? caracts : []) {
        porNombre[c.equipment] = (porNombre[c.equipment] || 0) + 1
      }
      const porId = {}
      for (const e of equiposLista) porId[e.id] = porNombre[e.name] || 0
      setConteos(porId)
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo obtener la lista de equipos')
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cargarDetalle = useCallback(
    async (equipoId) => {
      setCargandoDetalle(true)
      try {
        const data = await obtenerCaracteristicasDeEquipo(token, equipoId)
        setDetalle(data)
        setConteos((c) => ({ ...c, [equipoId]: data.length }))
      } catch {
        setDetalle([])
      } finally {
        setCargandoDetalle(false)
      }
    },
    [token],
  )

  function alternar(equipoId, modo) {
    if (abierta?.id === equipoId && abierta?.modo === modo) {
      setAbierta(null)
      return
    }
    setAbierta({ id: equipoId, modo })
    setDetalle([])
    cargarDetalle(equipoId)
  }

  const visibles = useMemo(() => {
    const filtro = busqueda.trim().toLowerCase()
    if (!filtro) return equipos
    return equipos.filter(
      (e) =>
        (e.name || '').toLowerCase().includes(filtro) ||
        (e.brand || '').toLowerCase().includes(filtro),
    )
  }, [equipos, busqueda])

  const hayRegistros = visibles.length > 0
  const mostrarEstado = cargando || errorCarga || !hayRegistros

  const estado = cargando ? (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-outline" strokeWidth={2} />
      <p className="font-body-md text-body-md text-on-surface-variant">Cargando equipos...</p>
    </div>
  ) : errorCarga ? (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <p className="font-label-bold text-label-bold text-on-surface">No se pudo cargar el catálogo</p>
      <p className="font-body-md text-body-md text-on-surface-variant">{errorCarga}</p>
      <button
        type="button"
        onClick={cargar}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
      >
        Reintentar
      </button>
    </div>
  ) : busqueda ? (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <p className="font-label-bold text-label-bold text-on-surface">No se encontraron resultados</p>
      <p className="font-body-md text-body-md text-on-surface-variant break-words">
        Ninguna coincidencia para “{busqueda}”.
      </p>
      <button
        type="button"
        onClick={() => setBusqueda('')}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
      >
        Limpiar búsqueda
      </button>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-1.5 px-5 py-14 text-center">
      <p className="font-label-bold text-label-bold text-on-surface">Aún no hay equipos registrados</p>
      <p className="font-body-md text-body-md text-on-surface-variant">
        Crea el primero para poder asignarle características.
      </p>
    </div>
  )

  // Editor compartido por la fila desplegada de escritorio y la tarjeta de
  // móvil: crear y actualizar recargan el detalle y, con él, el conteo -- que
  // es lo que hace que la fila pase del Estado A al Estado B sola.
  function editorDe(equipoId, soloLectura, iniciarAgregando) {
    return (
      <CaracteristicasDeEquipo
        equipmentId={equipoId}
        caracteristicas={detalle}
        cargando={cargandoDetalle}
        soloLectura={soloLectura}
        iniciarAgregando={iniciarAgregando}
        onCrear={async (payload) => {
          await crearCaracteristica(token, payload)
          await cargarDetalle(equipoId)
        }}
        onActualizar={async (caractId, payload) => {
          await actualizarCaracteristica(token, caractId, payload)
          await cargarDetalle(equipoId)
        }}
      />
    )
  }

  const iconoInactivo =
    'inline-grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant opacity-55 cursor-not-allowed'
  const iconoActivo =
    'inline-grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface'

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <Link
          to="/catalogo"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Catálogo
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">Equipos</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Inventario de equipo y sus características técnicas.
            </p>
          </div>

          <Link
            to="/catalogo/equipos/nuevo"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2} />
            Nuevo equipo
          </Link>
        </div>

        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar equipo o marca..." />

        {/* ---- Escritorio y tablet: tabla ---- */}
        <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {mostrarEstado ? (
            estado
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="w-20 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    ID
                  </th>
                  <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Equipo
                  </th>
                  <th className="w-40 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Marca
                  </th>
                  <th className="w-56 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Características
                  </th>
                  <th className="w-36 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-on-surface divide-y divide-outline-variant">
                {visibles.map((equipo) => {
                  const total = conteos[equipo.id] || 0
                  const tiene = total > 0
                  const desplegada = abierta?.id === equipo.id
                  return (
                    <Fragment key={equipo.id}>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="px-5 py-4 font-mono text-on-surface-variant tabular-nums">
                          {equipo.id}
                        </td>
                        <td className="px-5 py-4 font-medium text-on-surface break-words">
                          {equipo.name}
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant break-words">
                          {equipo.brand || '—'}
                        </td>
                        <td className="px-5 py-4">
                          {tiene ? (
                            <span className="font-label-bold text-label-bold text-on-surface">
                              {total} {total === 1 ? 'característica' : 'características'}
                            </span>
                          ) : (
                            <span className="font-body-md text-body-md text-on-surface-variant">
                              No contiene características
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {tiene ? (
                              <>
                                <Link
                                  to={`/catalogo/equipos/${equipo.id}/ver`}
                                  aria-label={`Ver información de ${equipo.name}`}
                                  title="Ver información completa"
                                  className={iconoActivo}
                                >
                                  <Eye className="h-4 w-4" strokeWidth={2} />
                                </Link>
                                <Link
                                  to={`/catalogo/equipos/${equipo.id}`}
                                  aria-label={`Editar ${equipo.name}`}
                                  title="Editar equipo y características"
                                  className={iconoActivo}
                                >
                                  <Pencil className="h-4 w-4" strokeWidth={2} />
                                </Link>
                              </>
                            ) : (
                              <>
                                <span
                                  aria-hidden="true"
                                  title="Sin características que ver"
                                  className={iconoInactivo}
                                >
                                  <Eye className="h-4 w-4" strokeWidth={2} />
                                </span>
                                <span
                                  aria-hidden="true"
                                  title="Sin características que editar"
                                  className={iconoInactivo}
                                >
                                  <Pencil className="h-4 w-4" strokeWidth={2} />
                                </span>
                                <button
                                  type="button"
                                  onClick={() => alternar(equipo.id, 'agregar')}
                                  aria-label={`Agregar característica a ${equipo.name}`}
                                  title="Agregar característica"
                                  className="ml-1 inline-grid h-9 w-9 place-items-center rounded-lg border border-outline-variant bg-surface text-on-surface transition-colors hover:border-outline hover:bg-surface-container-high"
                                >
                                  <Plus className="h-4 w-4" strokeWidth={2.25} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {desplegada && (
                        <tr className="bg-surface-container-low">
                          <td colSpan={5} className="px-5 py-4">
                            <div className="animate-view-in">
                              <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-2.5">
                                {abierta.modo === 'ver'
                                  ? 'Características registradas'
                                  : `Agregar característica a ${equipo.name}`}
                              </p>
                              {editorDe(equipo.id, abierta.modo === 'ver', abierta.modo === 'agregar')}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ---- Móvil: tarjetas apiladas; se toca la tarjeta completa ---- */}
        <div className="md:hidden flex flex-col gap-stack-sm">
          {mostrarEstado ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
              {estado}
            </div>
          ) : (
            visibles.map((equipo) => {
              const total = conteos[equipo.id] || 0
              const tiene = total > 0
              const desplegada = abierta?.id === equipo.id
              return (
                <div
                  key={equipo.id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => (tiene ? navigate(`/catalogo/equipos/${equipo.id}/ver`) : alternar(equipo.id, 'agregar'))}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-container-low"
                  >
                    <div className="min-w-0">
                      <p className="font-body-md text-body-md font-medium text-on-surface break-words">
                        {equipo.name}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant break-words">
                        {equipo.brand || '—'} · {tiene ? `${total} caract.` : 'Sin características'}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-on-surface-variant transition-transform duration-200 ${
                        desplegada ? 'rotate-180' : ''
                      }`}
                      strokeWidth={2}
                    />
                  </button>

                  {desplegada && (
                    <div className="animate-view-in border-t border-outline-variant px-4 py-3.5 flex flex-col gap-stack-sm">
                      {editorDe(equipo.id, false, !tiene)}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {!mostrarEstado && (
          <p className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">
            {visibles.length === equipos.length
              ? `${equipos.length} equipos`
              : `${visibles.length} de ${equipos.length} equipos`}
          </p>
        )}
      </div>
    </div>
  )
}

export default EquiposList
