import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, History, Loader2, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { obtenerEquipo, obtenerCaracteristicasDeEquipo, historialEquipo } from '../services/api.js'

/**
 * Vista completa de un equipo -- destino del ojo en la lista. Antes el ojo
 * solo mostraba las características en la misma tabla; ahora muestra TODA
 * la información del equipo (marca, modelo, serie, tipo, original/usado)
 * más sus características, en su propia pantalla de solo lectura.
 *
 * "Editar" pide confirmación antes de entrar al formulario de edición.
 */
function EquipoView() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [equipo, setEquipo] = useState(null)
  const [caracteristicas, setCaracteristicas] = useState([])
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    Promise.all([
      obtenerEquipo(token, Number(id)),
      obtenerCaracteristicasDeEquipo(token, Number(id)),
      historialEquipo(token, Number(id)),
    ])
      .then(([eq, caracts, hist]) => {
        if (!vivo) return
        setEquipo(eq)
        setCaracteristicas(caracts)
        setHistorial(Array.isArray(hist) ? hist : [])
      })
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el equipo'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [id, token])

  const campo = (label, valor) => (
    <div>
      <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">{label}</p>
      <p className="font-body-md text-body-md text-on-surface">{valor}</p>
    </div>
  )

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[800px] mx-auto flex flex-col gap-stack-md">
        <Link
          to="/catalogo/equipos"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Equipos
        </Link>

        {cargando ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-14 justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-outline" strokeWidth={2} />
            <span className="font-body-md text-body-md text-on-surface-variant">Cargando equipo...</span>
          </div>
        ) : error ? (
          <p className="font-label-sm text-label-sm text-error rounded-lg border border-error/30 bg-error-container/40 px-3 py-2">
            {error}
          </p>
        ) : (
          <>
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">{equipo.name}</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Información completa del equipo.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} />
                Editar
              </button>
            </div>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-4">Datos del equipo</h2>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                {campo('Marca', equipo.brand ?? '—')}
                {campo('Modelo', equipo.model ?? '—')}
                {campo('Serie', equipo.serie ?? '—')}
                {campo('Tipo', equipo.type ?? '—')}
                {campo('¿Es original?', equipo.original ? 'Sí' : 'No')}
                {campo('¿Está usado?', equipo.is_used ? 'Sí' : 'No')}
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-4">
                {caracteristicas.length > 0 ? `Características (${caracteristicas.length})` : 'Características'}
              </h2>
              {caracteristicas.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">No tiene características.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-outline-variant">
                  {caracteristicas.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 py-2.5">
                      <span className="font-label-bold text-label-bold text-on-surface">{c.name}:</span>
                      <span className="font-body-md text-body-md text-on-surface-variant">{c.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-on-surface mb-4">
                <History className="h-5 w-5 shrink-0 text-primary" strokeWidth={2} />
                {historial.length > 0 ? `Historial de Asignaciones (${historial.length})` : 'Historial de Asignaciones'}
              </h2>
              {historial.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Este equipo todavía no se le ha entregado a nadie.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-outline-variant">
                  {historial.map((h) => (
                    <li key={h.delivery_document_detail_id} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 py-2.5">
                      <div>
                        <p className="font-label-bold text-label-bold text-on-surface">{h.employee_name || '—'}</p>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          {h.employee_department || '—'} · Entregado el {h.delivery_date || '—'}
                        </p>
                        {h.returned && (
                          <p className="font-label-sm text-label-sm text-on-surface-variant">
                            Devuelto el {h.return_date || '—'}
                            {h.return_observations ? ` · ${h.return_observations}` : ''}
                          </p>
                        )}
                      </div>
                      <span
                        className={
                          h.returned
                            ? 'shrink-0 rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant'
                            : 'shrink-0 rounded-full bg-primary/10 px-2.5 py-1 font-label-sm text-label-sm text-primary'
                        }
                      >
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
