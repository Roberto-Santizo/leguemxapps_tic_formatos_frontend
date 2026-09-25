import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Eye, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useListaPaginada } from '../hooks/usePaginacion.js'
import useFiltrosActas from '../hooks/useFiltrosActas.js'
import useExportacionCsv from '../hooks/useExportacionCsv.js'
import Buscador from '../components/Buscador.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import FiltrosActas from '../components/FiltrosActas.jsx'
import IsotipoCarga from '../components/IsotipoCarga.jsx'
import { IndicadorGuardando } from '../components/Toast.jsx'
import Paginador from '../components/Paginador.jsx'
import { SkeletonTabla, SkeletonTarjetas } from '../components/Skeleton.jsx'
import { FORMATOS } from '../config/formatos.js'
import { listarDocumentosDevolucion } from '../services/api.js'
import { formatearFecha } from '../utils/fecha.js'
import { nombreEstado, puntoEstado } from '../utils/estadoEntrega.js'

/**
 * Lista de Documentos de Devolución (GET /return_documents). Mismo patrón
 * que HistorialEntregaList.jsx: escritorio con tabla + ojo (ver), móvil con
 * tarjetas sin botones que llevan directo al detalle. Sin eliminar -- la API
 * no ofrece DELETE para return_documents.
 *
 * Paginación y búsqueda en la URL (`?page=2&limit=20&q=juan`) vía useListaPaginada:
 * /return_documents se pide por página; la búsqueda trae todo una vez y
 * filtra en el cliente. Filtros de estado de la entrega y fecha
 * (useFiltrosActas), también en la URL y en el cliente.
 *
 * `departamento` (opcional, { id, name }): la misma lista, solo con las
 * devoluciones de ese departamento (DepartamentoHistorial.jsx). Cambian la
 * cabecera y el botón de volver, sobra la columna Departamento y aparece
 * "Exportar CSV" con TODAS las devoluciones que cumplen los filtros.
 */
function filtrarDevolucion(d, filtro) {
  return (
    (d.employee_name || '').toLowerCase().includes(filtro) ||
    (d.employee_department || '').toLowerCase().includes(filtro)
  )
}

function HistorialDevolucionList({ departamento } = {}) {
  const { token, isAdmin } = useAuth()
  const navigate = useNavigate()
  const enDepto = departamento !== undefined

  const { filtroExtra, hayFiltros, propsFiltros, limpiarFiltros } = useFiltrosActas({
    campoEstado: 'delivery_document_status',
    campoFecha: 'return_date',
    departamento,
  })
  const { exportando, exportar } = useExportacionCsv()

  const {
    registros: visibles,
    todosFiltrados,
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
    filtroExtra,
  })

  function exportarCsv() {
    exportar({
      nombre: `devoluciones-${departamento?.name || 'departamento'}`,
      filas: todosFiltrados,
      columnas: [
        { titulo: 'No. devolución', valor: (d) => d.id },
        { titulo: 'Fecha', valor: (d) => formatearFecha(d.return_date) },
        { titulo: 'Colaborador', valor: (d) => d.employee_name || '' },
        { titulo: 'Departamento', valor: (d) => d.employee_department || '' },
        { titulo: 'No. entrega', valor: (d) => d.delivery_document_id },
        { titulo: 'Estado de la entrega', valor: (d) => nombreEstado(d.delivery_document_status) },
      ],
    })
  }

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
  ) : hayFiltros ? (
    <EstadoVacio
      variante="busqueda"
      titulo="No hay devoluciones con estos filtros"
      descripcion="Cambia el estado o las fechas para ver más resultados."
      accion={
        <button type="button" onClick={limpiarFiltros} className={botonSecundario}>
          Limpiar filtros
        </button>
      }
    />
  ) : enDepto ? (
    <EstadoVacio
      icon={FORMATOS.devolucion.icon}
      titulo={`Todavía no hay devoluciones de ${departamento?.name || 'este departamento'}`}
      descripcion="Cuando un colaborador de este departamento devuelva equipo, aparecerá aquí."
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
    <div className="flex-1 animate-view-in px-4 pt-6 pb-10 md:px-8 md:pt-10">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <Link
          to={enDepto ? `/catalogo/departamentos/${departamento?.id}/ver` : '/historial'}
          className="inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {enDepto ? departamento?.name || 'Departamento' : 'Historial de Actas'}
        </Link>

        <div className="-mt-1 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end md:mt-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
              <span aria-hidden="true" className="h-px w-7 shrink-0 bg-outline" />
              <span className="min-w-0 truncate">{enDepto ? `Catálogo / Departamentos / ${departamento?.name || ''}` : 'Historial / Devolución'}</span>
            </div>
            <h1 className="mt-1.5 break-words font-display-lg text-titulo-movil text-on-surface md:text-display-lg">
              {enDepto ? `Devoluciones de ${departamento?.name || ''}` : 'Devolución de Equipo'}
            </h1>
            <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
              {enDepto
                ? 'Devoluciones de equipo de colaboradores de este departamento.'
                : 'Devoluciones registradas, parciales o completas, con la entrega de la que provienen.'}
            </p>
          </div>
          {enDepto ? (
            <button
              type="button"
              onClick={exportarCsv}
              disabled={exportando || cargando || Boolean(errorCarga)}
              aria-busy={exportando}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover disabled:opacity-50 active:scale-[0.97]"
            >
              {exportando ? <IsotipoCarga className="h-3" /> : <Download className="h-4 w-4" strokeWidth={1.75} />}
              Exportar CSV
            </button>
          ) : (
            isAdmin && (
              <Link
                to="/historial/devolucion/nueva"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97]"
              >
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Registrar devolución
              </Link>
            )
          )}
        </div>

        <div className="flex flex-col gap-stack-sm">
          <Buscador
            value={busqueda}
            onChange={setBusqueda}
            placeholder={enDepto ? 'Buscar por colaborador...' : 'Buscar por colaborador o departamento...'}
          />
          <FiltrosActas {...propsFiltros} />
        </div>

        {/* Tabla + paginador en una sola tarjeta en escritorio (el paginador
            queda de pie de tabla, como en el mockup); en móvil el envoltorio
            no dibuja nada y las tarjetas siguen sueltas. */}
        <div className="flex flex-col gap-stack-lg md:gap-0 md:overflow-hidden md:rounded-tarjeta md:bg-white md:shadow-tarjeta">
          {/* ---- Escritorio y tablet: tabla, ojo (ver) ---- */}
          <div className="hidden md:block overflow-x-auto">
            {cargando ? (
              <SkeletonTabla columnas={enDepto ? 5 : 6} filas={5} />
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
                    {!enDepto && (
                      <th className="min-w-[150px] h-11 px-4 font-mono text-micro font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                        Departamento
                      </th>
                    )}
                    <th className="w-24 h-11 px-4 font-mono text-micro font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                      Entrega
                    </th>
                    <th className="w-28 h-11 px-4 font-mono text-micro font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">
                      Estado
                    </th>
                    <th className="w-20 h-11 px-4 font-mono text-micro font-medium tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap text-right">
                      Ver
                    </th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {visibles.map((documento) => (
                    <tr key={documento.id} className="h-[72px] border-t border-outline-variant transition-colors duration-fast hover:bg-surface-container">
                      <td className="px-4 py-4 font-mono text-meta text-on-surface-variant tabular-nums whitespace-nowrap">
                        {formatearFecha(documento.return_date)}
                      </td>
                      <td className="px-4 py-4 font-medium text-on-surface break-words">
                        {documento.employee_name || '—'}
                      </td>
                      {!enDepto && (
                        <td className="px-4 py-4 text-on-surface-variant break-words">
                          {documento.employee_department || '—'}
                        </td>
                      )}
                      <td className="px-4 py-4 font-mono text-meta text-on-surface-variant tabular-nums whitespace-nowrap">
                        #{documento.delivery_document_id}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-outline-variant bg-white px-2.5 text-meta font-medium text-on-surface whitespace-nowrap">
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
                          <Eye className="h-4 w-4" strokeWidth={1.75} />
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
                  className="flex w-full items-center justify-between gap-3 rounded-tarjeta bg-white p-4 text-left shadow-tarjeta transition duration-fast ease-standard hover:shadow-flotante active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md font-semibold text-on-surface break-words">
                      {documento.employee_name || '—'}
                    </p>
                    <p className="mt-1 font-mono text-micro leading-4 text-on-surface-variant break-words">
                      {enDepto ? `Entrega #${documento.delivery_document_id}` : `${documento.employee_department || '—'} · Entrega #${documento.delivery_document_id}`}
                    </p>
                  </div>
                  <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-outline-variant bg-white px-2.5 text-meta font-medium text-on-surface">
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
                enPie
              />
            </div>
          )}
        </div>
      </div>

      <IndicadorGuardando activo={exportando} texto="Generando CSV" />
    </div>
  )
}

export default HistorialDevolucionList
