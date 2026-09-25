import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { SkeletonDetalle } from './Skeleton.jsx'
import EstadoVacio from './EstadoVacio.jsx'

/**
 * Vista de solo lectura de un registro de un catálogo simple (Marcas o
 * Departamentos) -- destino del ojo/tarjeta en la lista. Carga el registro
 * por su id con `onObtener` (igual que EquipoView), así que funciona con
 * URL directa o al recargar la página, no solo llegando desde la lista.
 * "Editar" pide confirmación y lleva a `rutaBase/:id`, la página de edición
 * (mismo patrón que Equipos: página aparte, no un modal).
 *
 * `extra(registro)` (opcional): contenido propio de un catálogo debajo de los
 * datos -- hoy, las tarjetas de historial de Departamentos.
 */
// Recetas visuales "Sierra" (BRIEF, ola 2), repetidas a propósito.
const botonVolver =
  'inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const botonSecundario =
  'inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const etiquetaDato = 'mb-1 font-mono text-micro uppercase leading-4 tracking-[0.1em] text-on-surface-variant'
const panelDato = 'min-w-0 rounded-xl bg-surface-container-high px-4 py-3'

function CatalogoRegistroView({ textos, onObtener, rutaBase, extra }) {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [registro, setRegistro] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  // Sube con "Reintentar" para volver a pedir el registro tras un error.
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    setError('')
    onObtener(token, Number(id))
      .then((data) => vivo && setRegistro(data))
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el registro'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [id, token, onObtener, intento])

  return (
    <div className="animate-view-in flex-1 px-4 pt-6 pb-10 md:px-8 md:pt-10">
      {/* Mismo ancho que su formulario (CatalogoFormPage, 600px): ver y editar
          de una misma entidad no deben cambiar de ancho al pasar de una a otra.
          Con `extra` (Departamentos: tarjetas de historial) la vista es algo más
          que los datos del formulario y usa el ancho de las pantallas de
          tarjetas (1200px), para no dejar media pantalla vacía. */}
      <div
        className={`${
          extra ? 'mx-auto max-w-[1200px]' : 'max-w-[600px] ml-[max(0px,calc((100%_-_1200px)/2))]'
        } flex flex-col gap-stack-lg`}
      >
        <Link to={rutaBase} className={botonVolver}>
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {textos.titulo}
        </Link>

        {cargando ? (
          <SkeletonDetalle secciones={1} camposPorSeccion={2} />
        ) : error ? (
          // Mismo estado de error que las listas (EstadoVacio con
          // "Reintentar"), en vez de una línea roja suelta sin ninguna salida.
          <div className="rounded-tarjeta bg-white shadow-tarjeta">
            <EstadoVacio
              variante="error"
              titulo="No se pudo cargar el registro"
              descripcion={error}
              accion={
                <button
                  type="button"
                  onClick={() => setIntento((n) => n + 1)}
                  className={botonSecundario}
                >
                  Reintentar
                </button>
              }
            />
          </div>
        ) : (
          <>
            {/* Rejilla de 2 columnas: el eyebrow ocupa todo el ancho y "Editar"
                queda siempre a la derecha del título (en móvil no baja a una
                línea propia). El envoltorio del texto es `contents` para no
                cambiar el orden del DOM. En móvil "Editar" se centra con la primera
                línea del título y la bajada usa todo el ancho; desde md: baja al pie
                de la bajada. */}
            <div className="-mt-1 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 md:mt-0">
              <div className="contents">
                <div className="col-span-2 flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
                  <span aria-hidden="true" className="h-px w-7 bg-outline" />
                  Catálogo / {textos.titulo} / Detalle
                </div>
                <h1 className="col-start-1 row-start-2 mt-1.5 break-words font-display-lg text-titulo-movil text-on-surface md:text-display-lg">
                  {registro.name}
                </h1>
                <p className="col-span-2 row-start-3 mt-1 md:col-span-1 font-body-lg text-body-lg text-on-surface-variant">Información completa del registro.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className={`col-start-2 row-start-2 mt-px self-start md:row-span-2 md:mt-0 md:self-end ${botonSecundario}`}
              >
                <Pencil className="h-4 w-4" strokeWidth={1.75} />
                Editar
              </button>
            </div>

            <section className="rounded-tarjeta bg-white p-4 shadow-tarjeta md:p-6">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-4">Datos del registro</h2>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div className={panelDato}>
                  <p className={etiquetaDato}>ID</p>
                  <p className="font-mono text-body-md text-on-surface tabular-nums">{registro.id}</p>
                </div>
                <div className={panelDato}>
                  <p className={etiquetaDato}>{textos.colNombre}</p>
                  <p className="break-words font-body-md text-body-md font-medium text-on-surface">{registro.name}</p>
                </div>
              </div>
            </section>

            {extra && extra(registro)}
          </>
        )}
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo={textos.tituloEditar}
        mensaje={registro ? `¿Desea editar "${registro.name}"?` : ''}
        textoConfirmar="Sí, editar"
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => navigate(`${rutaBase}/${id}`)}
      />
    </div>
  )
}

export default CatalogoRegistroView
