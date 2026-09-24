import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Pencil, Plus, ChevronDown, HardDrive } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useListaPaginada, usePaginaUrl } from '../hooks/usePaginacion.js'
import { normalizarBusqueda } from '../utils/texto.js'
import Buscador from '../components/Buscador.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import Paginador from '../components/Paginador.jsx'
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
 *
 * Paginación, búsqueda y filtro de estado en la URL
 * (`?page=2&limit=20&q=dell&estado=disponible`) vía useListaPaginada:
 * /equipments se pide por página; con búsqueda o filtro se trae todo una vez y
 * se filtra en el cliente. Características y disponibles se piden aparte,
 * completos (son listados de apoyo, no los que se paginan).
 */

// La búsqueda encuentra por nombre, marca y SERIE. La serie va por
// `normalizarBusqueda` (y no por un `includes` a secas como los otros dos)
// porque en la etiqueta física viene con separadores que nadie teclea igual:
// así "ABC-123 45" aparece escribiendo "abc12345", y con los últimos caracteres
// del sticker basta. Es la misma regla que usa el selector de equipo de Entrega
// de Equipo, para que los dos buscadores encuentren lo mismo.
function filtrarEquipo(e, filtro) {
  // Normalizada, una búsqueda de puros separadores ("-", ".") queda vacía, y
  // una cadena vacía la contienen todas las series: sin este guarda, teclear
  // un guion mostraría el inventario entero como si fuera un resultado.
  const serie = normalizarBusqueda(filtro)
  return (
    (e.name || '').toLowerCase().includes(filtro) ||
    (e.brand || '').toLowerCase().includes(filtro) ||
    (serie !== '' && normalizarBusqueda(e.serie).includes(serie))
  )
}

// Filtro por estado. El estado NO es un campo del equipo: se deduce cruzando
// con /equipments/available (ver `disponibles` más abajo), así que estos tres
// botones no se pueden traducir a un parámetro del backend -- filtran en el
// cliente, sobre el inventario completo.
const FILTROS_ESTADO = [
  { valor: '', etiqueta: 'Todos', activo: 'bg-tinta text-white' },
  {
    valor: 'disponible',
    etiqueta: 'Disponible',
    punto: 'bg-available',
    activo: 'bg-available-container text-on-available-container',
  },
  {
    valor: 'en-posesion',
    etiqueta: 'En posesión',
    punto: 'bg-assigned',
    activo: 'bg-assigned-container text-on-assigned-container',
  },
]

// Recetas visuales "Sierra" (BRIEF, ola 2), repetidas a propósito.
const botonVolver =
  'inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const botonPrimario =
  'inline-flex h-10 items-center justify-center gap-2 rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97]'
const celdaEncabezado =
  'h-11 px-4 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-on-surface-variant whitespace-nowrap'

function EquiposList() {
  const { token } = useAuth()
  const navigate = useNavigate()

  // Conteo de características por NOMBRE de equipo (el listado reducido de
  // /caracteristics trae el nombre, no el id -- así está documentado); se
  // traduce a id al pintar cada fila. Conteos ajustados a mano (tras crear
  // una característica desde la fila) van en `conteosPorId`, que manda.
  const [conteosPorNombre, setConteosPorNombre] = useState({})
  const [conteosPorId, setConteosPorId] = useState({})
  // Ids que SÍ aparecen en /equipments/available -- esos están libres. El
  // resto del inventario (los que no están en este set) está en posesión de
  // alguien. No hay un campo de estado en el equipo: se deriva cruzando con
  // este listado.
  const [disponibles, setDisponibles] = useState(null) // null = todavía no se sabe
  // `disponibles` vale null en dos casos muy distintos: todavía no llegó la
  // respuesta, o la llamada falló. Este flag los separa, que es lo que permite
  // esperar en un caso y rendirse en el otro.
  const [apoyoListo, setApoyoListo] = useState(false)

  // El estado elegido vive en la URL, igual que la página y la búsqueda, para
  // que refrescar o compartir el enlace conserve lo que se está viendo. Un
  // valor inventado a mano en la barra de direcciones se ignora.
  const { parametro, setParametro } = usePaginaUrl()
  const estadoUrl = parametro('estado')
  const estadoFiltro = FILTROS_ESTADO.some((f) => f.valor === estadoUrl) ? estadoUrl : ''

  // Null mientras no haya filtro o no se sepa quién está libre; en cuanto es
  // una función, useListaPaginada deja de pedir la lista por páginas y pasa a
  // traerla completa para poder filtrarla entera.
  const filtroEstado = useMemo(() => {
    if (!estadoFiltro || !disponibles) return null
    return (equipo) =>
      estadoFiltro === 'disponible' ? disponibles.has(equipo.id) : !disponibles.has(equipo.id)
  }, [estadoFiltro, disponibles])

  const {
    registros: visibles,
    total: totalEquipos,
    pagina,
    limite,
    ultimaPagina,
    busqueda,
    setBusqueda,
    limpiarBusqueda,
    irAPagina,
    cargando,
    error: errorCarga,
    recargar,
  } = useListaPaginada({
    token,
    listar: listarEquipos,
    filtrar: filtrarEquipo,
    mensajeError: 'No se pudo obtener la lista de equipos',
    filtroExtra: filtroEstado,
  })

  // Fila desplegada: solo para el alta ("+"); el ojo ahora navega a
  // /catalogo/equipos/:id/ver, la vista completa del equipo.
  const [abierta, setAbierta] = useState(null)
  const [detalle, setDetalle] = useState([])
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  // Editar pide confirmación antes de entrar al formulario, igual que en
  // Empleados y en el resto del catálogo -- antes el lápiz aquí navegaba
  // directo, sin preguntar.
  const [confirmando, setConfirmando] = useState(null) // equipo o null

  // Listados de apoyo, completos (sin `limit`): si alguno falla se omite su
  // dato en vez de tumbar la lista. Sin "disponibles" el badge de estado no
  // se muestra -- mejor omitirlo que mostrar un estado equivocado.
  const cargarApoyo = useCallback(async () => {
    setApoyoListo(false)
    const [caracts, libres] = await Promise.all([
      listarCaracteristicas(token).catch(() => []),
      listarEquiposDisponibles(token).catch(() => null),
    ])
    const porNombre = {}
    for (const c of Array.isArray(caracts) ? caracts : []) {
      porNombre[c.equipment] = (porNombre[c.equipment] || 0) + 1
    }
    setConteosPorNombre(porNombre)
    setConteosPorId({})
    setDisponibles(Array.isArray(libres) ? new Set(libres.map((e) => e.id)) : null)
    setApoyoListo(true)
  }, [token])

  useEffect(() => {
    cargarApoyo()
  }, [cargarApoyo])

  // Si /equipments/available falló no hay de dónde sacar el estado, así que el
  // filtro se quita de la URL en vez de quedarse puesto sin hacer nada (los
  // botones tampoco se muestran en ese caso, y una URL con un filtro invisible
  // se ve como un error del sistema).
  useEffect(() => {
    if (estadoFiltro && apoyoListo && !disponibles) setParametro('estado', '')
  }, [estadoFiltro, apoyoListo, disponibles, setParametro])

  // "Reintentar": vuelve a pedir la página y los listados de apoyo.
  const cargar = useCallback(() => {
    recargar()
    cargarApoyo()
  }, [recargar, cargarApoyo])

  const conteoDe = useCallback(
    (equipo) => conteosPorId[equipo.id] ?? conteosPorNombre[equipo.name] ?? 0,
    [conteosPorId, conteosPorNombre],
  )

  const cargarDetalle = useCallback(
    async (equipoId) => {
      setCargandoDetalle(true)
      try {
        const data = await obtenerCaracteristicasDeEquipo(token, equipoId)
        setDetalle(data)
        setConteosPorId((c) => ({ ...c, [equipoId]: data.length }))
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

  const hayRegistros = visibles.length > 0
  // Con un filtro de estado puesto no se puede pintar nada hasta saber quién
  // está libre: si no, se vería un instante el inventario completo sin filtrar
  // y luego daría un salto. Se sigue mostrando el esqueleto hasta entonces.
  const cargandoLista = cargando || (Boolean(estadoFiltro) && !apoyoListo)
  // La carga tiene sus propios esqueletos (misma forma que la tabla y las
  // tarjetas), así que se separa de los estados "sin contenido".
  const sinContenido = !cargandoLista && (Boolean(errorCarga) || !hayRegistros)

  const botonSecundario =
    'inline-flex h-10 items-center justify-center gap-2 rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'

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
      descripcion={
        estadoFiltro
          ? `Ninguna coincidencia para “${busqueda}” entre los equipos ${
              estadoFiltro === 'disponible' ? 'disponibles' : 'en posesión'
            }.`
          : `Ninguna coincidencia para “${busqueda}”.`
      }
      accion={
        <button type="button" onClick={limpiarBusqueda} className={botonSecundario}>
          Limpiar búsqueda
        </button>
      }
    />
  ) : estadoFiltro ? (
    <EstadoVacio
      icon={HardDrive}
      titulo={
        estadoFiltro === 'disponible' ? 'No hay equipos disponibles' : 'No hay equipos en posesión'
      }
      descripcion={
        estadoFiltro === 'disponible'
          ? 'Todo el inventario está entregado en este momento.'
          : 'Ningún equipo está entregado en este momento.'
      }
      accion={
        <button
          type="button"
          onClick={() => setParametro('estado', '')}
          className={botonSecundario}
        >
          Ver todos
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
  //
  // Colores: tokens `available` / `assigned` de tailwind.config.js, apagados
  // al mismo nivel que el rojo `error` del sistema. Antes eran el verde y
  // ámbar de fábrica de Tailwind (mucho más saturados que el resto de la
  // paleta) y traían variantes `dark:` en un sistema que es solo modo claro.
  function EstadoEquipo({ equipoId }) {
    if (!disponibles) return null
    const libre = disponibles.has(equipoId)
    return (
      <span
        className={[
          'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium leading-4 whitespace-nowrap',
          libre
            ? 'bg-available-container text-on-available-container'
            : 'bg-assigned-container text-on-assigned-container',
        ].join(' ')}
      >
        <span
          className={['h-1.5 w-1.5 rounded-full', libre ? 'bg-available' : 'bg-assigned'].join(' ')}
          aria-hidden="true"
        />
        {libre ? 'Disponible' : 'En posesión'}
      </span>
    )
  }

  const iconoActivo =
    'inline-flex h-9 w-9 items-center justify-center rounded-boton text-on-surface-variant transition duration-fast ease-standard hover:bg-surface-container hover:text-on-surface active:scale-[0.90]'

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <Link to="/catalogo" className={botonVolver}>
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Catálogo
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
              <span aria-hidden="true" className="h-px w-7 bg-outline" />
              Catálogo / Equipos
            </div>
            <h1 className="mt-1.5 font-display-lg text-[26px] leading-[32px] font-extrabold tracking-[-0.04em] text-on-surface md:text-display-lg">
              Equipos
            </h1>
            <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
              Inventario de equipo y sus características técnicas.
            </p>
          </div>

          <Link to="/catalogo/equipos/nuevo" className={botonPrimario}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Nuevo equipo
          </Link>
        </div>

        <div className="flex flex-col gap-stack-sm">
          <Buscador
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar equipo, marca o serie..."
          />

          {/* Filtro por estado. Tres botones y no un desplegable: son pocas
              opciones y conviene ver de un golpe cuál está puesta. Se ocultan
              mientras no se sepa quién está libre, igual que el badge de cada
              fila -- es preferible no ofrecer el filtro que ofrecer uno que
              devolvería un resultado equivocado. */}
          {disponibles && (
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filtrar por estado"
            >
              {FILTROS_ESTADO.map(({ valor, etiqueta, punto, activo }) => {
                const puesto = estadoFiltro === valor
                return (
                  <button
                    key={valor || 'todos'}
                    type="button"
                    onClick={() => setParametro('estado', valor)}
                    aria-pressed={puesto}
                    className={[
                      'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium leading-4 transition duration-fast ease-standard active:scale-[0.97]',
                      puesto
                        ? `border-transparent ${activo}`
                        : 'border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                    ].join(' ')}
                  >
                    {punto && (
                      <span className={`h-1.5 w-1.5 rounded-full ${punto}`} aria-hidden="true" />
                    )}
                    {etiqueta}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ---- Escritorio y tablet: tabla ---- */}
        {/* overflow-x-auto (antes overflow-hidden): a 768px el área útil no
            alcanza para las columnas de esta tabla y la de acciones quedaba
            cortada e inalcanzable, sin forma de desplazarse. Mismo patrón que
            ya usaban las tablas de actas. */}
        <div className="hidden md:block rounded-tarjeta bg-white shadow-tarjeta overflow-x-auto">
          {cargandoLista ? (
            <SkeletonTabla columnas={6} filas={5} />
          ) : sinContenido ? (
            estado
          ) : (
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container">
                  <th className={`w-20 ${celdaEncabezado}`}>ID</th>
                  <th className={celdaEncabezado}>Equipo</th>
                  <th className={`w-40 ${celdaEncabezado}`}>Marca</th>
                  <th className={`w-56 ${celdaEncabezado}`}>Características</th>
                  <th className={`w-32 ${celdaEncabezado}`}>Estado</th>
                  <th className={`w-36 text-right ${celdaEncabezado}`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {visibles.map((equipo) => {
                  const total = conteoDe(equipo)
                  const tiene = total > 0
                  const desplegada = abierta?.id === equipo.id
                  return (
                    <Fragment key={equipo.id}>
                      <tr
                        data-reveal
                        className="border-t border-outline-variant transition-colors duration-fast ease-standard hover:bg-surface-container-low"
                      >
                        <td className="h-[72px] px-4 py-4 font-mono text-[12px] text-on-surface-variant tabular-nums">
                          {equipo.id}
                        </td>
                        {/* La serie va debajo del nombre y no en columna
                            aparte: la tabla ya se desborda a 768px y una
                            séptima columna la empujaría más. Se muestra porque
                            el buscador ahora encuentra por serie, y un
                            resultado que no la enseña no se puede contrastar
                            contra la etiqueta del equipo. */}
                        <td className="px-4 py-4 font-medium text-on-surface break-words">
                          {equipo.name}
                          {equipo.serie && (
                            <span className="mt-0.5 block break-all font-mono text-[12px] font-normal uppercase leading-4 text-on-surface-variant">
                              {equipo.serie}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-on-surface-variant break-words">
                          {equipo.brand || '—'}
                        </td>
                        <td className="px-4 py-4">
                          {tiene ? (
                            <span className="font-medium text-on-surface">
                              {total} {total === 1 ? 'característica' : 'características'}
                            </span>
                          ) : (
                            <span className="text-on-surface-subtle">
                              No contiene características
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <EstadoEquipo equipoId={equipo.id} />
                        </td>
                        <td className="px-4 py-4">
                          {/* Ver y editar son del EQUIPO, no de sus
                              características: antes se deshabilitaban cuando el
                              equipo no tenía ninguna, y entonces no había forma
                              de abrir ni corregir su nombre, marca, modelo o
                              serie desde esta lista. El "+" sigue apareciendo
                              solo cuando falta la primera característica. */}
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/catalogo/equipos/${equipo.id}/ver`}
                              aria-label={`Ver información de ${equipo.name}`}
                              title="Ver"
                              className={iconoActivo}
                            >
                              <Eye className="h-4 w-4" strokeWidth={1.75} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setConfirmando(equipo)}
                              aria-label={`Editar ${equipo.name}`}
                              title="Editar equipo y características"
                              className={iconoActivo}
                            >
                              <Pencil className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                            {!tiene && (
                              <button
                                type="button"
                                onClick={() => alternar(equipo.id, 'agregar')}
                                aria-label={`Agregar característica a ${equipo.name}`}
                                title="Agregar característica"
                                className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-boton border border-outline-variant bg-white text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.90]"
                              >
                                <Plus className="h-4 w-4" strokeWidth={1.75} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {desplegada && (
                        <tr className="border-t border-outline-variant bg-surface-container-low">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="animate-drop-in">
                              <p className="mb-3 font-mono text-[11px] uppercase leading-4 tracking-[0.1em] text-on-surface-variant">
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
          {cargandoLista ? (
            <SkeletonTarjetas filas={4} />
          ) : sinContenido ? (
            <div className="rounded-tarjeta bg-white shadow-tarjeta">
              {estado}
            </div>
          ) : (
            visibles.map((equipo) => {
              const total = conteoDe(equipo)
              const tiene = total > 0
              const desplegada = abierta?.id === equipo.id
              return (
                <div
                  key={equipo.id}
                  className="overflow-hidden rounded-tarjeta bg-white shadow-tarjeta"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/catalogo/equipos/${equipo.id}/ver`)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left transition duration-fast ease-standard active:bg-surface-container-low active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <p className="font-body-md text-body-md font-semibold text-on-surface break-words">
                        {equipo.name}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-4 text-on-surface-variant break-words">
                        {equipo.brand || '—'} · {tiene ? `${total} caract.` : 'Sin características'}
                      </p>
                      {equipo.serie && (
                        <p className="mt-0.5 break-all font-mono text-[11px] uppercase leading-4 tracking-[0.1em] text-on-surface-subtle">
                          {equipo.serie}
                        </p>
                      )}
                      <div className="mt-2">
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
                    <div className="animate-drop-in border-t border-outline-variant bg-surface-container-low px-4 py-3.5 flex flex-col gap-stack-sm">
                      {editorDe(equipo.id, false, !tiene)}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {!cargandoLista && !errorCarga && (
          <Paginador
            pagina={pagina}
            ultimaPagina={ultimaPagina}
            tamano={limite}
            total={totalEquipos}
            plural="equipos"
            onCambiar={irAPagina}
          />
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
