import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useListaPaginada } from '../hooks/usePaginacion.js'
import Buscador from '../components/Buscador.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import Paginador from '../components/Paginador.jsx'
import { SkeletonTabla, SkeletonTarjetas } from '../components/Skeleton.jsx'
import { FORMATOS } from '../config/formatos.js'
import { listarDocumentosDevolucion } from '../services/api.js'
import { formatearFecha } from '../utils/fecha.js'

function nombreEstado(status) {
  if (status === 'devuelto') return 'Devuelto'
  if (status === 'parcial') return 'Parcial'
  if (status === 'pendiente') return 'Pendiente'
  return '—'
}

// Punto de color del chip de estado (solo decorativo): devuelto = salvia,
// parcial = ocre, el resto gris -- los mismos acentos apagados de Equipos.
function puntoEstado(status) {
  if (status === 'devuelto') return 'bg-available'
  if (status === 'parcial') return 'bg-assigned'
  return 'bg-outline'
}

/**
 * Lista de Documentos de Devolución (GET /return_documents). Mismo patrón
 * que HistorialEntregaList.jsx: escritorio con tabla + ojo (ver), móvil con
 * tarjetas sin botones que llevan directo al detalle. Sin eliminar -- la API
 * no ofrece DELETE para return_documents.
 *
 * Paginación y búsqueda en la URL (`?page=2&limit=20&q=juan`) vía useListaPaginada:
 * /return_documents se pide por página; la búsqueda trae todo una vez y
 * filtra en el cliente.
 */
function filtrarDevolucion(d, filtro) {
  return (
    (d.employee_name || '').toLowerCase().includes(filtro) ||
    (d.employee_department || '').toLowerCase().includes(filtro)
  )
}

function HistorialDevolucionList() {
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
    listar: listarDocumentosDevolucion,
    filtrar: filtrarDevolucion,
    mensajeError: 'No se pudo obtener la lista de devoluciones',
  })

  const hayRegistros = visibles.length > 0
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
      icon={FORMATOS.devolucion.icon}
      titulo="Todavía no hay devoluciones registradas"
      descripcion={
        isAdmin ? 'Busca al responsable que está devolviendo equipo para registrar la primera.' : 'Todavía no hay devoluciones para consultar.'
      }
      accion={
        isAdmin ? (
          <Link to="/historial/devolucion/nueva" className={botonSecundario}>
            Registrar devolución
          </Link>
        ) : undefined
      }
    />
  )

  const iconoActivo =
    'inline-flex h-9 w-9 items-center justify-center rounded-boton text-on-surface-variant transition duration-fast ease-standard hover:bg-surface-container hover:text-on-surface active:scale-[0.90]'

  function verDocumento(documento) {
    navigate(`/historial/devolucion/${documento.id}`)
  }

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <Link
          to="/historial"
          className="inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Historial de Actas
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
              <span aria-hidden="true" className="h-px w-7 bg-outline" />
              Historial / Devolución
            </div>
            <h1 className="mt-1.5 font-display-lg text-[26px] leading-[32px] font-extrabold tracking-[-0.04em] text-on-surface md:text-display-lg">
              Devolución de Equipo
            </h1>
            <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
              Devoluciones registradas, parciales o completas, con la entrega de la que provienen.
            </p>
          </div>
          {isAdmin && (
            <Link
              to="/historial/devolucion/nueva"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Registrar devolución
            </Link>
          )}
        </div>

        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por colaborador o departamento..." />

        {/* Tabla + paginador en una sola tarjeta en escritorio (el paginador
            queda de pie de tabla, como en el mockup); en móvil el envoltorio
            no dibuja nada y las tarjetas siguen sueltas. */}
        <div className="flex flex-col gap-stack-lg md:gap-0 md:overflow-hidden md:rounded-tarjeta md:bg-white md:shadow-tarjeta">
          {/* ---- Escritorio y tablet: tabla, ojo (ver) ---- */}
          <div className="hidden md:block overflow-x-auto">
            {cargando ? (
              <SkeletonTabla columnas={6} filas={5} />
            ) : sinContenido ? (
              estado
            ) : (
              <table className="w-full min-w-[720px] text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container">
                    <th className="h-11 px-4 font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                      Fecha
                    </th>
                    <th className="h-11 px-4 font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                      Colaborador
                    </th>
                    <th className="h-11 px-4 font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                      Departamento
                    </th>
                    <th className="w-28 h-11 px-4 font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                      Entrega
                    </th>
                    <th className="w-32 h-11 px-4 font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                      Estado
                    </th>
                    <th className="w-16 h-11 px-4 font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap text-right">
                      Ver
                    </th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {visibles.map((documento) => (
                    <tr key={documento.id} data-reveal className="h-[72px] border-t border-outline-variant transition-colors duration-fast hover:bg-surface-container-low">
                      <td className="px-4 py-4 font-mono text-[12px] text-on-surface-variant tabular-nums whitespace-nowrap">
                        {formatearFecha(documento.return_date)}
                      </td>
                      <td className="px-4 py-4 font-medium text-on-surface break-words">
                        {documento.employee_name || '—'}
                      </td>
                      <td className="px-4 py-4 text-on-surface-variant break-words">
                        {documento.employee_department || '—'}
                      </td>
                      <td className="px-4 py-4 font-mono text-[12px] text-on-surface-variant tabular-nums">
                        #{documento.delivery_document_id}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-outline-variant bg-white px-2.5 text-[12px] font-medium text-on-surface whitespace-nowrap">
                          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${puntoEstado(documento.delivery_document_status)}`} />
                          {nombreEstado(documento.delivery_document_status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => verDocumento(documento)}
                          aria-label={`Ver devolución de ${documento.employee_name}`}
                          title="Ver"
                          className={iconoActivo}
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </button>
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
                  data-reveal
                  className="flex w-full items-center justify-between gap-3 rounded-tarjeta bg-white p-4 text-left shadow-tarjeta transition duration-fast ease-standard hover:shadow-flotante active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md font-semibold text-on-surface break-words">
                      {documento.employee_name || '—'}
                    </p>
                    <p className="mt-1 font-mono text-[11px] leading-4 text-on-surface-variant break-words">
                      {documento.employee_department || '—'} · Entrega #{documento.delivery_document_id}
                    </p>
                  </div>
                  <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-outline-variant bg-white px-2.5 text-[12px] font-medium text-on-surface">
                    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${puntoEstado(documento.delivery_document_status)}`} />
                    {nombreEstado(documento.delivery_document_status)}
                  </span>
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
                plural="devoluciones"
                onCambiar={irAPagina}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistorialDevolucionList
