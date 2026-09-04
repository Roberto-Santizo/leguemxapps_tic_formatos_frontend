import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Pencil, Plus, FileText, Download, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Buscador from './Buscador.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

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
 */

// Estado vacío / cargando / sin resultados. Se usa igual en la tabla (dentro
// de un td que ocupa toda la fila) y en la lista de tarjetas.
function EstadoLista({ cargando, error, hayRegistros, busqueda, textos, onReintentar, onLimpiar }) {
  if (cargando) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-outline" strokeWidth={2} />
        <p className="font-body-md text-body-md text-on-surface-variant">
          Cargando {textos.plural}...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
        <p className="font-label-bold text-label-bold text-on-surface">No se pudo cargar el catálogo</p>
        <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
        <button
          type="button"
          onClick={onReintentar}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!hayRegistros && busqueda) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
        <p className="font-label-bold text-label-bold text-on-surface">No se encontraron resultados</p>
        <p className="font-body-md text-body-md text-on-surface-variant break-words">
          Ninguna coincidencia para “{busqueda}”.
        </p>
        <button
          type="button"
          onClick={onLimpiar}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
        >
          Limpiar búsqueda
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1.5 px-5 py-14 text-center">
      <p className="font-label-bold text-label-bold text-on-surface">{textos.vacioTitulo}</p>
      <p className="font-body-md text-body-md text-on-surface-variant">{textos.vacioTexto}</p>
    </div>
  )
}

function CatalogoLista({ textos, onListar, rutaBase }) {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Confirmación antes de editar (escritorio: lápiz de la fila).
  const [confirmando, setConfirmando] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      const data = await onListar(token)
      setRegistros(Array.isArray(data) ? data : [])
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo obtener la lista')
    } finally {
      setCargando(false)
    }
  }, [onListar, token])

  useEffect(() => {
    cargar()
  }, [cargar])

  const visibles = useMemo(() => {
    const filtro = busqueda.trim().toLowerCase()
    if (!filtro) return registros
    return registros.filter((r) => (r.name || '').toLowerCase().includes(filtro))
  }, [registros, busqueda])

  function verRegistro(registro) {
    navigate(`${rutaBase}/${registro.id}/ver`)
  }

  const hayRegistros = visibles.length > 0
  const mostrarEstado = cargando || errorCarga || !hayRegistros

  const estado = (
    <EstadoLista
      cargando={cargando}
      error={errorCarga}
      hayRegistros={hayRegistros}
      busqueda={busqueda}
      textos={textos}
      onReintentar={cargar}
      onLimpiar={() => setBusqueda('')}
    />
  )

  return (
    <>
      <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
          <Link
            to="/catalogo"
            className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Catálogo
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">
                {textos.titulo}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">{textos.subtitulo}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Demo: la exportación de catálogos queda para una fase futura,
                  cuando el backend exponga los endpoints correspondientes. */}
              <button
                type="button"
                disabled
                title="Disponible en una fase futura"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface-variant opacity-55 cursor-not-allowed"
              >
                <FileText className="h-4 w-4" strokeWidth={2.25} />
                PDF
              </button>
              <button
                type="button"
                disabled
                title="Disponible en una fase futura"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface-variant opacity-55 cursor-not-allowed"
              >
                <Download className="h-4 w-4" strokeWidth={2.25} />
                Exportar
              </button>
              <Link
                to={`${rutaBase}/nuevo`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95"
              >
                <Plus className="h-4.5 w-4.5" strokeWidth={2} />
                {textos.textoCrear}
              </Link>
            </div>
          </div>

          <Buscador value={busqueda} onChange={setBusqueda} placeholder={textos.placeholderBusqueda} />

          {/* ---- Desktop y tablet: tabla, ojo (ver) + lápiz (editar con confirmación) ---- */}
          <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            {mostrarEstado ? (
              estado
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="w-24 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                      ID
                    </th>
                    <th className="px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                      {textos.colNombre}
                    </th>
                    <th className="w-28 px-5 py-3.5 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-on-surface divide-y divide-outline-variant">
                  {visibles.map((registro) => (
                    <tr key={registro.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-5 py-4 font-mono text-on-surface-variant tabular-nums">
                        {registro.id}
                      </td>
                      <td className="px-5 py-4 font-medium text-on-surface break-words">
                        {registro.name}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => verRegistro(registro)}
                            aria-label={`Ver ${registro.name}`}
                            title="Ver"
                            className="inline-grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                          >
                            <Eye className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmando(registro)}
                            aria-label={`Editar ${registro.name}`}
                            title="Editar"
                            className="inline-grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={2} />
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
            {mostrarEstado ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
                {estado}
              </div>
            ) : (
              visibles.map((registro) => (
                <button
                  key={registro.id}
                  type="button"
                  onClick={() => verRegistro(registro)}
                  className="flex w-full items-center justify-between gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm px-4 py-3.5 text-left transition-colors hover:bg-surface-container-low"
                >
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md font-medium text-on-surface break-words">
                      {registro.name}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant font-mono tabular-nums">
                      ID {registro.id}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {!mostrarEstado && (
            <p className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">
              {visibles.length === registros.length
                ? `${registros.length} ${textos.plural}`
                : `${visibles.length} de ${registros.length} ${textos.plural}`}
            </p>
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
