import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, X, FileText, Download, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Buscador from './Buscador.jsx'

/**
 * Lista de un catálogo simple (solo campo `name`): Marcas o Departamentos.
 *
 * MarcasList.jsx y DepartamentosList.jsx son envolturas de este componente,
 * así que la lógica de cargar / crear / editar / buscar existe UNA sola vez.
 * Lo único que cambia entre ambas pantallas son los textos y las funciones
 * de API que se reciben por props.
 *
 * Responsive: los mismos datos se pintan de dos formas -- tabla en md: y
 * superior, tarjetas apiladas debajo de md -- para que en móvil nunca haya
 * scroll horizontal. No se duplica estado ni lógica, solo el marcado.
 *
 * Solo listar, crear y editar: la API de Laravel para /brands y /departments
 * no expone borrado, así que no hay botón de eliminar.
 */

const inputClasses =
  'h-11 w-full rounded-lg border border-outline-variant bg-surface px-3.5 font-body-md text-body-md text-on-surface transition-colors hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60'

// Modal de crear/editar. A diferencia de ActaModal NO pide contraseña: la
// documentación de Laravel para PUT /brands/{id} y PUT /departments/{id} no
// la exige.
function CatalogoModal({ abierto, registro, textos, procesando, error, erroresCampo, onGuardar, onCancelar }) {
  const [name, setName] = useState('')

  const esEdicion = Boolean(registro?.id)

  useEffect(() => {
    if (abierto) setName(registro?.name ?? '')
  }, [abierto, registro])

  if (!abierto) return null

  function handleSubmit(e) {
    e.preventDefault()
    const limpio = name.trim()
    if (!limpio) return
    onGuardar(limpio)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/40 px-4">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-lg border border-outline-variant overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h3 className="font-headline-lg text-headline-lg text-on-surface">
            {esEdicion ? textos.tituloEditar : textos.tituloCrear}
          </h3>
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-stack-md">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface">{textos.labelCampo}</label>
            <input
              className={inputClasses}
              value={name}
              disabled={procesando}
              onChange={(e) => setName(e.target.value)}
              placeholder={textos.placeholderCampo}
              required
              maxLength={255}
              autoFocus
            />
            {erroresCampo?.name?.[0] && (
              <p className="font-label-sm text-label-sm text-error">{erroresCampo.name[0]}</p>
            )}
          </div>

          {error && (
            <p className="text-error font-label-sm text-label-sm bg-error-container/40 border border-error/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancelar}
              disabled={procesando}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={procesando || !name.trim()}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95 disabled:opacity-60"
            >
              {procesando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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

function CatalogoLista({ textos, onListar, onCrear, onActualizar }) {
  const { token } = useAuth()

  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [enEdicion, setEnEdicion] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState('')
  const [erroresCampo, setErroresCampo] = useState(null)

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

  function abrirCrear() {
    setEnEdicion(null)
    setErrorModal('')
    setErroresCampo(null)
    setModalAbierto(true)
  }

  function abrirEditar(registro) {
    setEnEdicion(registro)
    setErrorModal('')
    setErroresCampo(null)
    setModalAbierto(true)
  }

  async function handleGuardar(name) {
    setGuardando(true)
    setErrorModal('')
    setErroresCampo(null)
    try {
      if (enEdicion?.id) {
        const actualizado = await onActualizar(token, enEdicion.id, { name })
        setRegistros((lista) =>
          lista.map((r) => (r.id === enEdicion.id ? { ...r, ...(actualizado || { name }) } : r)),
        )
      } else {
        const creado = await onCrear(token, { name })
        setRegistros((lista) => [creado ?? { id: Date.now(), name }, ...lista])
      }
      setModalAbierto(false)
      setEnEdicion(null)
    } catch (err) {
      setErrorModal(err.message || 'No se pudo guardar')
      setErroresCampo(err.errors || null)
    } finally {
      setGuardando(false)
    }
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
      <div className="flex-1 p-container-padding md:p-stack-lg bg-background">
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
              <button
                onClick={abrirCrear}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95"
              >
                <Plus className="h-4.5 w-4.5" strokeWidth={2} />
                {textos.textoCrear}
              </button>
            </div>
          </div>

          <Buscador value={busqueda} onChange={setBusqueda} placeholder={textos.placeholderBusqueda} />

          {/* ---- Desktop y tablet: tabla ---- */}
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
                        <button
                          type="button"
                          onClick={() => abrirEditar(registro)}
                          aria-label={`Editar ${registro.name}`}
                          title="Editar"
                          className="inline-grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ---- Móvil: tarjetas apiladas, sin scroll horizontal ---- */}
          <div className="md:hidden flex flex-col gap-stack-sm">
            {mostrarEstado ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
                {estado}
              </div>
            ) : (
              visibles.map((registro) => (
                <div
                  key={registro.id}
                  className="flex items-center justify-between gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md font-medium text-on-surface break-words">
                      {registro.name}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant font-mono tabular-nums">
                      ID {registro.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirEditar(registro)}
                    aria-label={`Editar ${registro.name}`}
                    title="Editar"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
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

      <CatalogoModal
        abierto={modalAbierto}
        registro={enEdicion}
        textos={textos}
        procesando={guardando}
        error={errorModal}
        erroresCampo={erroresCampo}
        onGuardar={handleGuardar}
        onCancelar={() => {
          setModalAbierto(false)
          setEnEdicion(null)
        }}
      />
    </>
  )
}

export default CatalogoLista
