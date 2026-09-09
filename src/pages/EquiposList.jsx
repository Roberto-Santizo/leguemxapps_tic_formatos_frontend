import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Pencil, Plus, ChevronDown, HardDrive } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Buscador from '../components/Buscador.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import { SkeletonTabla, SkeletonTarjetas } from '../components/Skeleton.jsx'
import { CaracteristicasDeEquipo } from '../components/CaracteristicasEditor.jsx'
import {
  listarEquipos,
  listarEquiposDisponibles,
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
  // Ids que SÍ aparecen en /equipments/available -- esos están libres. El
  // resto del inventario (los que no están en este set) está en posesión de
  // alguien. No hay un campo de estado en el equipo: se deriva cruzando con
  // este listado.
  const [disponibles, setDisponibles] = useState(null) // null = todavía no se sabe
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Fila desplegada: solo para el alta ("+"); el ojo ahora navega a
  // /catalogo/equipos/:id/ver, la vista completa del equipo.
  const [abierta, setAbierta] = useState(null)
  const [detalle, setDetalle] = useState([])
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  // Editar pide confirmación antes de entrar al formulario, igual que en
  // Empleados y en el resto del catálogo -- antes el lápiz aquí navegaba
  // directo, sin preguntar.
  const [confirmando, setConfirmando] = useState(null) // equipo o null

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      const [lista, caracts, libres] = await Promise.all([
        listarEquipos(token),
        listarCaracteristicas(token).catch(() => []),
        // Si falla, se deja "disponibles" en null y el badge de estado no
        // se muestra -- mejor omitirlo que mostrar un estado equivocado.
        listarEquiposDisponibles(token).catch(() => null),
      ])
      const equiposLista = Array.isArray(lista) ? lista : []
      setEquipos(equiposLista)
      setDisponibles(Array.isArray(libres) ? new Set(libres.map((e) => e.id)) : null)

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
  // La carga tiene sus propios esqueletos (misma forma que la tabla y las
  // tarjetas), así que se separa de los estados "sin contenido".
  const sinContenido = !cargando && (Boolean(errorCarga) || !hayRegistros)

  const botonSecundario =
    'inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform'

  const estado = errorCarga ? (
    <EstadoVacio
      variante="error"
      titulo="No se pudo cargar el catálogo"
      descripcion={errorCarga}
      accion={
        <button type="button" onClick={cargar} className={botonSecundario}>
          Reintentar
        </button>
      }
    />
  ) : busqueda ? (
    <EstadoVacio
      variante="busqueda"
      titulo="No se encontraron resultados"
      descripcion={`Ninguna coincidencia para “${busqueda}”.`}
      accion={
        <button type="button" onClick={() => setBusqueda('')} className={botonSecundario}>
          Limpiar búsqueda
        </button>
      }
    />
  ) : (
    <EstadoVacio
      icon={HardDrive}
      titulo="Aún no hay equipos registrados"
      descripcion="Crea el primero para poder asignarle características."
      accion={
        <Link to="/catalogo/equipos/nuevo" className={botonSecundario}>
          Nuevo equipo
        </Link>
      }
    />
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

  // Badge de estado por fila/tarjeta. `libre` es undefined mientras no se
  // sabe (disponibles === null, ej. falló la llamada) -- en ese caso no se
  // pinta nada en vez de arriesgar un estado incorrecto.
  function EstadoEquipo({ equipoId }) {
    if (!disponibles) return null
    const libre = disponibles.has(equipoId)
    return (
      <span
        className={[
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-medium whitespace-nowrap',
          libre
            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        ].join(' ')}
      >
        <span
          className={['h-1.5 w-1.5 rounded-full', libre ? 'bg-green-600' : 'bg-amber-600'].join(' ')}
          aria-hidden="true"
        />
        {libre ? 'Disponible' : 'En posesión'}
      </span>
    )
  }

  const iconoInactivo =
    'inline-grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant opacity-55 cursor-not-allowed'
  const iconoActivo =
    'inline-grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface active:scale-[0.90] transition-transform'

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <Link
          to="/catalogo"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest active:scale-[0.97] transition-transform"
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
          {cargando ? (
            <SkeletonTabla columnas={6} filas={5} />
          ) : sinContenido ? (
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
                  <th className="w-32 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                    Estado
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
                          <EstadoEquipo equipoId={equipo.id} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {tiene ? (
                              <>
                                <Link
                                  to={`/catalogo/equipos/${equipo.id}/ver`}
                                  aria-label={`Ver información de ${equipo.name}`}
                                  title="Ver"
                                  className={iconoActivo}
                                >
                                  <Eye className="h-4 w-4" strokeWidth={2} />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => setConfirmando(equipo)}
                                  aria-label={`Editar ${equipo.name}`}
                                  title="Editar equipo y características"
                                  className={iconoActivo}
                                >
                                  <Pencil className="h-4 w-4" strokeWidth={2} />
                                </button>
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
                                  className="ml-1 inline-grid h-9 w-9 place-items-center rounded-lg border border-outline-variant bg-surface text-on-surface transition-colors hover:border-outline hover:bg-surface-container-high active:scale-[0.90] transition-transform"
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
                          <td colSpan={6} className="px-5 py-4">
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
          {cargando ? (
            <SkeletonTarjetas filas={4} />
          ) : sinContenido ? (
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
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-all hover:bg-surface-container-low active:bg-surface-container-low active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <p className="font-body-md text-body-md font-medium text-on-surface break-words">
                        {equipo.name}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant break-words">
                        {equipo.brand || '—'} · {tiene ? `${total} caract.` : 'Sin características'}
                      </p>
                      <div className="mt-1.5">
                        <EstadoEquipo equipoId={equipo.id} />
                      </div>
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

        {!cargando && !sinContenido && (
          <p className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">
            {visibles.length === equipos.length
              ? `${equipos.length} equipos`
              : `${visibles.length} de ${equipos.length} equipos`}
          </p>
        )}
      </div>

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo="Editar equipo"
        mensaje={confirmando ? `¿Desea editar "${confirmando.name}"?` : ''}
        textoConfirmar="Sí, editar"
        onCancelar={() => setConfirmando(null)}
        onConfirmar={() => navigate(`/catalogo/equipos/${confirmando.id}`)}
      />
    </div>
  )
}

export default EquiposList
