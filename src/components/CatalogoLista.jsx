import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Pencil, Plus, FileText, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useListaPaginada } from '../hooks/usePaginacion.js'
import Buscador from './Buscador.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import EstadoVacio from './EstadoVacio.jsx'
import Paginador from './Paginador.jsx'
import { SkeletonTabla, SkeletonTarjetas } from './Skeleton.jsx'

/**
 * Lista de un catálogo simple (solo campo `name`): Marcas o Departamentos.
 *
 * Flujo (igual al de Equipos, en páginas separadas -- no modales):
 *   - "Nueva marca/departamento" lleva a `rutaBase/nuevo`.
 *   - Escritorio: fila con ojo (ver, sin confirmación, va a `rutaBase/:id/ver`)
 *     y lápiz (pide confirmación y va a `rutaBase/:id`, la página de edición).
 *   - Móvil: la tarjeta entera es el toque -- sin botones -- y lleva a la
 *     página de detalle (`rutaBase/:id/ver`). Desde ahí, "Editar" pide la
 *     misma confirmación y lleva a `rutaBase/:id`.
 *
 * MarcasList.jsx y DepartamentosList.jsx son envolturas de este componente,
 * así que la lógica de cargar / buscar existe UNA sola vez.
 *
 * Paginación y búsqueda viven en la URL (`?page=2&limit=20&q=dell`) vía
 * useListaPaginada: sin texto se pide al servidor solo la página actual; con
 * texto se trae todo una vez y se filtra/pagina en el cliente (el backend no
 * tiene filtro de texto en /brands ni /departments).
 */

// Recetas visuales "Sierra" (BRIEF, ola 2): mismas clases en todas las
// pantallas de Catálogo, repetidas a propósito en vez de un <Button> genérico.
const botonSecundario =
  'inline-flex h-10 items-center justify-center gap-2 rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const botonVolver =
  'inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const botonPrimario =
  'inline-flex h-10 items-center justify-center gap-2 rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97]'
const botonFuturo =
  'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface-variant opacity-50 cursor-not-allowed'
const celdaEncabezado =
  'h-11 px-4 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-on-surface-variant whitespace-nowrap'
const botonIconoTabla =
  'inline-flex h-9 w-9 items-center justify-center rounded-boton text-on-surface-variant transition duration-fast ease-standard hover:bg-surface-container hover:text-on-surface active:scale-[0.90]'

/**
 * Estado sin contenido: error, búsqueda sin coincidencias, o catálogo vacío.
 * La carga ya NO pasa por aquí -- tiene sus propios esqueletos, que conservan
 * la forma de la tabla y de las tarjetas para que no salte el layout.
 *
 * El estado vacío usa el mismo ícono que la tarjeta de Catálogo desde la que
 * se entró (textos.icono), para que la pantalla se sienta continuación de esa
 * tarjeta y no un lugar distinto.
 */
function EstadoLista({ error, hayRegistros, busqueda, textos, onReintentar, onLimpiar }) {
  if (error) {
    return (
      <EstadoVacio
        variante="error"
        titulo="No se pudo cargar el catálogo"
        descripcion={error}
        accion={
          <button type="button" onClick={onReintentar} className={botonSecundario}>
            Reintentar
          </button>
        }
      />
    )
  }

  if (!hayRegistros && busqueda) {
    return (
      <EstadoVacio
        variante="busqueda"
        titulo="No se encontraron resultados"
        descripcion={`Ninguna coincidencia para “${busqueda}”.`}
        accion={
          <button type="button" onClick={onLimpiar} className={botonSecundario}>
            Limpiar búsqueda
          </button>
        }
      />
    )
  }

  return <EstadoVacio icon={textos.icono} titulo={textos.vacioTitulo} descripcion={textos.vacioTexto} />
}

function filtrarPorNombre(registro, filtro) {
  return (registro.name || '').toLowerCase().includes(filtro)
}

function CatalogoLista({ textos, onListar, rutaBase }) {
  const { token } = useAuth()
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
    listar: onListar,
    filtrar: filtrarPorNombre,
    mensajeError: 'No se pudo obtener la lista',
  })

  // Confirmación antes de editar (escritorio: lápiz de la fila).
  const [confirmando, setConfirmando] = useState(null)

  function verRegistro(registro) {
    navigate(`${rutaBase}/${registro.id}/ver`)
  }

  const hayRegistros = visibles.length > 0
  const sinContenido = !cargando && (Boolean(errorCarga) || !hayRegistros)

  const estado = (
    <EstadoLista
      error={errorCarga}
      hayRegistros={hayRegistros}
      busqueda={busqueda}
      textos={textos}
      onReintentar={cargar}
      onLimpiar={limpiarBusqueda}
    />
  )

  return (
    <>
      <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
          <Link to="/catalogo" className={botonVolver}>
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Catálogo
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
                <span aria-hidden="true" className="h-px w-7 bg-outline" />
                Catálogo / {textos.titulo}
              </div>
              <h1 className="mt-1.5 font-display-lg text-[26px] leading-[32px] font-extrabold tracking-[-0.04em] text-on-surface md:text-display-lg">
                {textos.titulo}
              </h1>
              <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">{textos.subtitulo}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Demo: la exportación de catálogos queda para una fase futura,
                  cuando el backend exponga los endpoints correspondientes. */}
              <button
                type="button"
                disabled
                title="Disponible en una fase futura"
                className={botonFuturo}
              >
                <FileText className="h-4 w-4" strokeWidth={1.75} />
                PDF
              </button>
              <button
                type="button"
                disabled
                title="Disponible en una fase futura"
                className={botonFuturo}
              >
                <Download className="h-4 w-4" strokeWidth={1.75} />
                Exportar
              </button>
              <Link to={`${rutaBase}/nuevo`} className={botonPrimario}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                {textos.textoCrear}
              </Link>
            </div>
          </div>

          <Buscador value={busqueda} onChange={setBusqueda} placeholder={textos.placeholderBusqueda} />

          {/* ---- Desktop y tablet: tabla, ojo (ver) + lápiz (editar con confirmación) ---- */}
          <div className="hidden md:block rounded-tarjeta bg-white shadow-tarjeta overflow-x-auto">
            {cargando ? (
              <SkeletonTabla columnas={3} filas={5} />
            ) : sinContenido ? (
              estado
            ) : (
              <table className="w-full min-w-[520px] text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container">
                    <th className={`w-24 ${celdaEncabezado}`}>ID</th>
                    <th className={celdaEncabezado}>{textos.colNombre}</th>
                    <th className={`w-28 text-right ${celdaEncabezado}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {visibles.map((registro) => (
                    <tr
                      key={registro.id}
                      data-reveal
                      className="border-t border-outline-variant transition-colors duration-fast ease-standard hover:bg-surface-container-low"
                    >
                      <td className="h-[72px] px-4 py-4 font-mono text-[12px] text-on-surface-variant tabular-nums">
                        {registro.id}
                      </td>
                      <td className="px-4 py-4 font-medium text-on-surface break-words">
                        {registro.name}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => verRegistro(registro)}
                            aria-label={`Ver ${registro.name}`}
                            title="Ver"
                            className={botonIconoTabla}
                          >
                            <Eye className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmando(registro)}
                            aria-label={`Editar ${registro.name}`}
                            title="Editar"
                            className={botonIconoTabla}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.75} />
                          </button>
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
              <div className="rounded-tarjeta bg-white shadow-tarjeta">
                {estado}
              </div>
            ) : (
              visibles.map((registro) => (
                <button
                  key={registro.id}
                  type="button"
                  onClick={() => verRegistro(registro)}
                  className="flex w-full items-center justify-between gap-3 rounded-tarjeta bg-white p-4 text-left shadow-tarjeta transition duration-fast ease-standard active:scale-[0.99] active:bg-surface-container-low"
                >
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md font-semibold text-on-surface break-words">
                      {registro.name}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant tabular-nums">
                      ID {registro.id}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {!cargando && !errorCarga && (
            <Paginador
              pagina={pagina}
              ultimaPagina={ultimaPagina}
              tamano={limite}
              total={total}
              plural={textos.plural}
              onCambiar={irAPagina}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo={textos.tituloEditar}
        mensaje={confirmando ? `¿Desea editar "${confirmando.name}"?` : ''}
        textoConfirmar="Sí, editar"
        onCancelar={() => setConfirmando(null)}
        onConfirmar={() => {
          const registro = confirmando
          setConfirmando(null)
          navigate(`${rutaBase}/${registro.id}`)
        }}
      />
    </>
  )
}

export default CatalogoLista
