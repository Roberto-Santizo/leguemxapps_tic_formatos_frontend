import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, History, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { SkeletonDetalle } from '../components/Skeleton.jsx'
import EstadoVacio from '../components/EstadoVacio.jsx'
import { obtenerEquipo, obtenerCaracteristicasDeEquipo, historialEquipo, obtenerMarca } from '../services/api.js'
import { formatearFecha } from '../utils/fecha.js'
// El backend guarda el tipo en inglés (enum EquipmentType); la lista con su
// etiqueta en español vive junto al formulario que la usa para elegir.
import { etiquetaTipoEquipo } from './EquipoForm.jsx'

/**
 * Vista completa de un equipo -- destino del ojo en la lista. Antes el ojo
 * solo mostraba las características en la misma tabla; ahora muestra TODA
 * la información del equipo (marca, modelo, serie, tipo, original/usado)
 * más sus características, en su propia pantalla de solo lectura.
 *
 * "Editar" pide confirmación antes de entrar al formulario de edición.
 */
// Recetas visuales "Sierra" (BRIEF, ola 2), repetidas a propósito.
const botonVolver =
  'inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const botonSecundario =
  'inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const tarjeta = 'rounded-tarjeta bg-white p-4 shadow-tarjeta md:p-6'
const tituloSeccion =
  'mb-4 flex items-center gap-2 font-headline-md text-headline-md font-bold text-on-surface'

function EquipoView() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [equipo, setEquipo] = useState(null)
  const [marca, setMarca] = useState(null)
  const [caracteristicas, setCaracteristicas] = useState([])
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  // Sube con "Reintentar" para volver a pedir el equipo tras un error.
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    // Sin esto, tras un error "Reintentar" seguiría mostrando el error aunque
    // la nueva carga funcionara (el render revisa `error` antes que los datos).
    setError('')
    // GET /equipments/{id} solo trae brand_id (no el nombre de la marca), así
    // que hay que pedirlo aparte con obtenerMarca -- por eso primero se pide
    // el equipo y luego, ya con el brand_id en mano, el resto en paralelo.
    obtenerEquipo(token, Number(id))
      .then((eq) => {
        if (!vivo) return eq
        setEquipo(eq)
        return Promise.all([
          eq.brand_id ? obtenerMarca(token, eq.brand_id) : Promise.resolve(null),
          obtenerCaracteristicasDeEquipo(token, Number(id)),
          historialEquipo(token, Number(id)),
        ])
      })
      .then((resto) => {
        if (!vivo || !resto) return
        const [marcaObtenida, caracts, hist] = resto
        setMarca(marcaObtenida)
        setCaracteristicas(caracts)
        setHistorial(Array.isArray(hist) ? hist : [])
      })
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el equipo'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [id, token, intento])

  const campo = (label, valor) => (
    <div className="min-w-0 rounded-xl bg-surface-container-high px-4 py-3">
      <p className="mb-1 font-mono text-micro uppercase leading-4 tracking-[0.1em] text-on-surface-variant">{label}</p>
      <p className="break-words font-body-md text-body-md font-medium text-on-surface">{valor}</p>
    </div>
  )

  return (
    <div className="animate-view-in flex-1 px-4 pt-6 pb-10 md:px-8 md:pt-10">
      {/* Mismo ancho que su formulario (EquipoForm, 900px): ver y editar de
          una misma entidad no deben cambiar de ancho al pasar de una a otra. */}
      {/* Mismo carril de 1200px que la lista del catálogo (ver y editar no
          cambian de ancho respecto a ella). */}
      <div className="mx-auto flex max-w-[1200px] flex-col gap-stack-lg">
        <Link to="/catalogo/equipos" className={botonVolver}>
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Equipos
        </Link>

        {cargando ? (
          <SkeletonDetalle secciones={3} camposPorSeccion={3} />
        ) : error ? (
          // Mismo estado de error que las listas (EstadoVacio con
          // "Reintentar"), en vez de una línea roja suelta sin ninguna salida.
          <div className="rounded-tarjeta bg-white shadow-tarjeta">
            <EstadoVacio
              variante="error"
              titulo="No se pudo cargar el equipo"
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
                  Catálogo / Equipos / Detalle
                </div>
                <h1 className="col-start-1 row-start-2 mt-1.5 break-words font-display-lg text-titulo-movil text-on-surface md:text-display-lg">
                  {equipo.name}
                </h1>
                <p className="col-span-2 row-start-3 mt-1 md:col-span-1 font-body-lg text-body-lg text-on-surface-variant">Información completa del equipo.</p>
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

            <section data-reveal className={tarjeta}>
              <h2 className={tituloSeccion}>Datos del equipo</h2>
              {/* Seis datos: 3 × 2 en escritorio y 2 × 3 en móvil, sin una
                  baldosa huérfana en la última fila. */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {campo('Marca', marca?.name ?? '—')}
                {campo('Modelo', equipo.model ?? '—')}
                {campo('Serie', equipo.serie ?? '—')}
                {campo('Tipo', etiquetaTipoEquipo(equipo.type))}
                {campo('¿Es original?', equipo.original ? 'Sí' : 'No')}
                {campo('¿Está usado?', equipo.is_used ? 'Sí' : 'No')}
              </div>
            </section>

            <section data-reveal className={tarjeta}>
              <h2 className={tituloSeccion}>
                {caracteristicas.length > 0 ? `Características (${caracteristicas.length})` : 'Características'}
              </h2>
              {caracteristicas.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">No tiene características.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-outline-variant">
                  {caracteristicas.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 py-3">
                      <span className="font-body-md text-body-md font-semibold text-on-surface">{c.name}:</span>
                      <span className="font-body-md text-body-md text-on-surface-variant">{c.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section data-reveal className={tarjeta}>
              <h2 className={tituloSeccion}>
                <History className="h-5 w-5 shrink-0 text-on-surface-variant" strokeWidth={1.75} />
                {historial.length > 0 ? `Historial de Asignaciones (${historial.length})` : 'Historial de Asignaciones'}
              </h2>
              {historial.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Este equipo todavía no se le ha entregado a nadie.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-outline-variant">
                  {historial.map((h) => (
                    <li key={h.delivery_document_detail_id} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 py-3">
                      <div className="min-w-0">
                        <p className="font-body-md text-body-md font-semibold text-on-surface">{h.employee_name || '—'}</p>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          {h.employee_department || '—'} · Entregado el {formatearFecha(h.delivery_date)}
                        </p>
                        {h.returned && (
                          <p className="mt-0.5 font-mono text-micro leading-4 tracking-[0.04em] text-on-surface-subtle">
                            Devuelto el {formatearFecha(h.return_date)}
                            {h.return_observations ? ` · ${h.return_observations}` : ''}
                          </p>
                        )}
                      </div>
                      <span
                        className={
                          h.returned
                            ? 'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 text-meta font-medium leading-4 text-on-surface-variant'
                            : 'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-outline-variant bg-white px-2.5 text-meta font-medium leading-4 text-on-surface'
                        }
                      >
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full ${h.returned ? 'bg-outline' : 'bg-on-surface'}`}
                        />
                        {h.returned ? 'Devuelto' : 'En uso'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo="Editar equipo"
        mensaje={equipo ? `¿Desea editar "${equipo.name}"?` : ''}
        textoConfirmar="Sí, editar"
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => navigate(`/catalogo/equipos/${id}`)}
      />
    </div>
  )
}

export default EquipoView
