import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useListaPaginada } from '../hooks/usePaginacion.js'
import Buscador from '../components/Buscador.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import Paginador from '../components/Paginador.jsx'
import { SkeletonTabla, SkeletonTarjetas } from '../components/Skeleton.jsx'
import { IndicadorGuardando, mostrarToast } from '../components/Toast.jsx'
import { FORMATOS } from '../config/formatos.js'
import { listarDocumentosEntrega, eliminarDocumentoEntrega } from '../services/api.js'
import { formatearFecha } from '../utils/fecha.js'

function nombrePlanta(location) {
  if (location === 'Planta Tejar' || location === 'Planta Parramos') return location
  return Number(location) === 1 ? 'Planta Tejar' : 'Planta Parramos'
}

/**
 * Lista de Documentos de Entrega (GET /delivery_documents). Mismo flujo que
 * el resto del catálogo: escritorio con ojo (ver) + basura (eliminar, con
 * confirmación); móvil con tarjetas sin botones que llevan directo al
 * detalle, donde también está la opción de eliminar.
 *
 * Paginación y búsqueda en la URL (`?page=2&limit=20&q=juan`) vía useListaPaginada:
 * /delivery_documents se pide por página; la búsqueda trae todo una vez y
 * filtra en el cliente.
 */
function filtrarEntrega(d, filtro) {
  return (
    (d.employee_name || '').toLowerCase().includes(filtro) ||
    (d.employee_department || '').toLowerCase().includes(filtro) ||
    nombrePlanta(d.location).toLowerCase().includes(filtro)
  )
}

function HistorialEntregaList() {
  const { token, isAdmin } = useAuth()
  const navigate = useNavigate()

  const {
    registros: visibles,
    total,
    pagina,
    limite,
    ultimaPagina,
    busqueda,
    setBusqueda,
    limpiarBusqueda,
    irAPagina,
    cargando,
    error: errorCarga,
    recargar: cargar,
  } = useListaPaginada({
    token,
    listar: listarDocumentosEntrega,
    filtrar: filtrarEntrega,
    mensajeError: 'No se pudo obtener la lista de entregas',
  })

  const [eliminando, setEliminando] = useState(null) // documento o null
  const [borrando, setBorrando] = useState(false)
  const [errorBorrar, setErrorBorrar] = useState('')

  async function confirmarEliminar() {
    const documento = eliminando
    setBorrando(true)
    setErrorBorrar('')
    try {
      await eliminarDocumentoEntrega(token, documento.id)
      // Se vuelve a pedir la página actual (paginacion.md §5) en vez de
      // quitar la fila a mano: así entra el registro que corría de la
      // página siguiente y, si esta quedó vacía, el hook retrocede una.
      cargar()
      setEliminando(null)
      mostrarToast('Entrega eliminada')
    } catch (err) {
      setErrorBorrar(err.message || 'No se pudo eliminar el documento')
    } finally {
      setBorrando(false)
    }
  }

  const hayRegistros = visibles.length > 0
  // La carga tiene su propio tratamiento (esqueletos con la forma real de la
  // tabla / las tarjetas), así que se separa de los estados "sin contenido".
  const sinContenido = !cargando && (Boolean(errorCarga) || !hayRegistros)

  const botonSecundario =
    'inline-flex h-10 items-center justify-center gap-2 rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'

  const estado = errorCarga ? (
    <EstadoVacio
      variante="error"
      titulo="No se pudo cargar el historial"
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
        <button type="button" onClick={limpiarBusqueda} className={botonSecundario}>
          Limpiar búsqueda
        </button>
      }
    />
  ) : (
    <EstadoVacio
      icon={FORMATOS.entrega.icon}
      titulo="Todavía no hay entregas registradas"
      descripcion={
        isAdmin ? 'Registra una desde "Nueva Acta" → "Entrega de Equipo".' : 'Todavía no hay entregas para consultar.'
      }
      accion={
        isAdmin ? (
          <Link to="/actas/entrega/nueva" className={botonSecundario}>
            Registrar una entrega
          </Link>
        ) : undefined
      }
    />
  )

  const iconoActivo =
    'inline-flex h-9 w-9 items-center justify-center rounded-boton text-on-surface-variant transition duration-fast ease-standard hover:bg-surface-container hover:text-on-surface active:scale-[0.90]'
  // La basura es la única acción irreversible de la tabla: gris en reposo
  // (como el ojo) pero roja al pasar el mouse, igual que "quitar equipo" en
  // HistorialEntregaView -- rojo = borrar, la regla de la paleta. Antes usaba
  // iconoActivo y se veía igual de inofensiva que "ver".
  const iconoPeligro =
    'inline-flex h-9 w-9 items-center justify-center rounded-boton text-on-surface-variant transition duration-fast ease-standard hover:bg-error-container/60 hover:text-error active:scale-[0.90]'

  function verDocumento(documento) {
    navigate(`/historial/entrega/${documento.id}`)
  }

  return (
    <div className="flex-1 animate-view-in px-4 pt-6 pb-10 md:px-8 md:pt-10">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <Link
          to="/historial"
          className="inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Historial de Actas
        </Link>

        <div className="-mt-1 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end md:mt-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
              <span aria-hidden="true" className="h-px w-7 bg-outline" />
              Historial / Entrega
            </div>
            <h1 className="mt-1.5 font-display-lg text-titulo-movil text-on-surface md:text-display-lg">
              Entrega de Equipo
            </h1>
            <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
              Documentos de entrega registrados, con el equipo incluido en cada uno.
            </p>
          </div>
          {isAdmin && (
            <Link
              to="/actas/entrega/nueva"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Registrar entrega
            </Link>
          )}
        </div>

        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por colaborador, departamento o planta..." />

        {/* Tabla + paginador en una sola tarjeta en escritorio (el paginador
            queda de pie de tabla, como en el mockup); en móvil el envoltorio
            no dibuja nada y las tarjetas siguen sueltas. */}
        <div className="flex flex-col gap-stack-lg md:gap-0 md:overflow-hidden md:rounded-tarjeta md:bg-white md:shadow-tarjeta">
          {/* ---- Escritorio y tablet: tabla, ojo (ver) + basura (eliminar con confirmación) ---- */}
          <div className="hidden md:block overflow-x-auto">
            {cargando ? (
              <SkeletonTabla columnas={6} filas={5} />
            ) : sinContenido ? (
              estado
            ) : (
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container">
                    <th className="h-11 px-4 font-mono text-micro font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                      Fecha
                    </th>
                    <th className="min-w-[160px] h-11 px-4 font-mono text-micro font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                      Colaborador
                    </th>
                    <th className="min-w-[150px] h-11 px-4 font-mono text-micro font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                      Departamento
                    </th>
                    <th className="h-11 px-4 font-mono text-micro font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                      Planta
                    </th>
                    <th className="w-24 h-11 px-4 font-mono text-micro font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                      Equipos
                    </th>
                    <th className="w-28 h-11 px-4 font-mono text-micro font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {visibles.map((documento) => (
                    <tr key={documento.id} className="h-[72px] border-t border-outline-variant transition-colors duration-fast hover:bg-surface-container">
                      <td className="px-4 py-4 font-mono text-meta text-on-surface-variant tabular-nums whitespace-nowrap">
                        {formatearFecha(documento.delivery_date)}
                      </td>
                      <td className="px-4 py-4 font-medium text-on-surface break-words">
                        {documento.employee_name || '—'}
                      </td>
                      <td className="px-4 py-4 text-on-surface-variant break-words">
                        {documento.employee_department || '—'}
                      </td>
                      <td className="px-4 py-4 text-on-surface-variant">
                        {nombrePlanta(documento.location)}
                      </td>
                      <td className="px-4 py-4 font-mono text-meta text-on-surface-variant tabular-nums whitespace-nowrap">
                        {Array.isArray(documento.items) ? documento.items.length : 0}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => verDocumento(documento)}
                            aria-label={`Ver entrega de ${documento.employee_name}`}
                            title="Ver"
                            className={iconoActivo}
                          >
                            <Eye className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setEliminando(documento)}
                              aria-label={`Eliminar entrega de ${documento.employee_name}`}
                              title="Eliminar"
                              className={iconoPeligro}
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ---- Móvil: tarjetas apiladas, sin botones -- toda la tarjeta lleva al detalle ---- */}
          <div className="md:hidden flex flex-col gap-stack-sm">
            {cargando ? (
              <SkeletonTarjetas filas={4} />
            ) : sinContenido ? (
              <div className="rounded-tarjeta bg-white shadow-tarjeta">{estado}</div>
            ) : (
              visibles.map((documento) => (
                <button
                  key={documento.id}
                  type="button"
                  onClick={() => verDocumento(documento)}
                  className="flex w-full items-center justify-between gap-3 rounded-tarjeta bg-white p-4 text-left shadow-tarjeta transition duration-fast ease-standard hover:shadow-flotante active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md font-semibold text-on-surface break-words">
                      {documento.employee_name || '—'}
                    </p>
                    <p className="mt-1 font-mono text-micro leading-4 text-on-surface-variant break-words">
                      {nombrePlanta(documento.location)} · {Array.isArray(documento.items) ? documento.items.length : 0} equipo(s)
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {!cargando && !errorCarga && (
            <div className="md:border-t md:border-outline-variant md:bg-surface-container md:px-4 md:py-2.5">
              <Paginador
                pagina={pagina}
                ultimaPagina={ultimaPagina}
                tamano={limite}
                total={total}
                plural="entregas"
                onCambiar={irAPagina}
                enPie
              />
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        abierto={Boolean(eliminando)}
        variante="peligro"
        titulo="Eliminar documento de entrega"
        mensaje={
          eliminando
            ? `¿Desea eliminar la entrega de "${eliminando.employee_name}"? Esta acción no se puede deshacer.`
            : ''
        }
        error={errorBorrar}
        procesando={borrando}
        textoConfirmar="Sí, eliminar"
        onCancelar={() => {
          if (borrando) return
          setEliminando(null)
          setErrorBorrar('')
        }}
        onConfirmar={confirmarEliminar}
      />

      <IndicadorGuardando activo={borrando} texto="Eliminando" />
    </div>
  )
}

export default HistorialEntregaList
