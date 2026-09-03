import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { listarMarcas } from '../services/api.js'
import {
  crearEquipo,
  obtenerEquipo,
  actualizarEquipo,
  crearCaracteristica,
  actualizarCaracteristica,
  obtenerCaracteristicasDeEquipo,
} from '../services/api.equipos.js'
import {
  FilasCaracteristicas,
  CaracteristicasDeEquipo,
  hayNombreRepetido,
} from '../components/CaracteristicasEditor.jsx'

/**
 * Alta y edición de un equipo (POST /equipments, PUT /equipments/{id}).
 *
 * Alta: al final del formulario se pregunta "¿Desea agregar características?".
 * Con "No" se guarda el equipo tal cual. Con "Sí" aparecen filas repetibles
 * que se envían como POST /caracteristics una vez creado el equipo (la API
 * exige `equipment_id`, así que no pueden ir antes).
 *
 * Edición: se edita el equipo y, debajo, sus características ya persistidas
 * en sitio (InlineEditableText), sin modales.
 *
 * Los campos son los que exige EquipmentRequest en Laravel: name, model,
 * brand_id, serie, original, is_used, type. La API no tiene un campo
 * `description` para el equipo -- lo descriptivo vive en Modelo/Tipo y en
 * las características.
 */

const inputClasses =
  'h-11 w-full rounded-lg border border-outline-variant bg-surface px-3.5 font-body-md text-body-md text-on-surface transition-colors hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60'

const TIPOS = ['laptop', 'desktop', 'monitor', 'impresora', 'teléfono', 'accesorio', 'otro']

const VACIO = {
  name: '',
  model: '',
  brand_id: '',
  serie: '',
  type: '',
  original: true,
  is_used: false,
}

// Par de botones Sí / No con el mismo lenguaje visual que los chips de
// accesorios de FormatoActa.
function ElijeSiNo({ label, value, onChange, disabled, ayuda }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-label-bold text-label-bold text-on-surface">{label}</label>
      <div className="flex gap-2.5">
        {[
          { texto: 'Sí', valor: true },
          { texto: 'No', valor: false },
        ].map((opcion) => (
          <button
            key={opcion.texto}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opcion.valor)}
            className={`inline-flex h-11 min-w-[84px] items-center justify-center rounded-lg border px-4 font-label-bold text-label-bold transition-colors disabled:opacity-60 ${
              value === opcion.valor
                ? 'border-primary bg-primary text-on-primary shadow-sm'
                : 'border-outline-variant bg-surface text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {opcion.texto}
          </button>
        ))}
      </div>
      {ayuda && <p className="font-label-sm text-label-sm text-on-surface-variant">{ayuda}</p>}
    </div>
  )
}

function EquipoForm() {
  const { id } = useParams()
  const esEdicion = Boolean(id)
  const navigate = useNavigate()
  const { token } = useAuth()

  const [form, setForm] = useState(VACIO)
  const [marcas, setMarcas] = useState([])
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [erroresCampo, setErroresCampo] = useState(null)

  // Alta: pregunta y filas en borrador.
  const [quiereCaracteristicas, setQuiereCaracteristicas] = useState(null)
  const [filas, setFilas] = useState([{ name: '', description: '' }])

  // Edición: características ya persistidas.
  const [caracteristicas, setCaracteristicas] = useState([])
  const [cargandoCaract, setCargandoCaract] = useState(esEdicion)

  useEffect(() => {
    let vivo = true
    listarMarcas(token)
      .then((data) => vivo && setMarcas(Array.isArray(data) ? data : []))
      .catch(() => vivo && setMarcas([]))
    return () => {
      vivo = false
    }
  }, [token])

  const cargarCaracteristicas = useCallback(async () => {
    if (!esEdicion) return
    setCargandoCaract(true)
    try {
      const data = await obtenerCaracteristicasDeEquipo(token, Number(id))
      setCaracteristicas(data)
    } catch {
      setCaracteristicas([])
    } finally {
      setCargandoCaract(false)
    }
  }, [esEdicion, id, token])

  useEffect(() => {
    if (!esEdicion) return
    let vivo = true
    setCargando(true)
    obtenerEquipo(token, Number(id))
      .then((equipo) => {
        if (!vivo || !equipo) return
        setForm({
          name: equipo.name ?? '',
          model: equipo.model ?? '',
          brand_id: equipo.brand_id ?? '',
          serie: equipo.serie ?? '',
          type: equipo.type ?? '',
          original: Boolean(equipo.original),
          is_used: Boolean(equipo.is_used),
        })
      })
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el equipo'))
      .finally(() => vivo && setCargando(false))
    cargarCaracteristicas()
    return () => {
      vivo = false
    }
  }, [esEdicion, id, token, cargarCaracteristicas])

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  const filasValidas = useMemo(
    () => filas.filter((f) => f.name.trim() && f.description.trim()),
    [filas],
  )

  const hayDuplicadoEnBorrador = useMemo(
    () =>
      filasValidas.some((f, i) =>
        hayNombreRepetido(
          f.name,
          filasValidas.filter((_, j) => j !== i).map((x) => x.name),
        ),
      ),
    [filasValidas],
  )

  const completo =
    form.name.trim() && form.model.trim() && form.brand_id && form.serie.trim() && form.type.trim()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!completo || hayDuplicadoEnBorrador) return

    setGuardando(true)
    setError('')
    setErroresCampo(null)

    const payload = {
      name: form.name.trim(),
      model: form.model.trim(),
      brand_id: Number(form.brand_id),
      serie: form.serie.trim(),
      type: form.type.trim(),
      original: Boolean(form.original),
      is_used: Boolean(form.is_used),
    }

    try {
      if (esEdicion) {
        await actualizarEquipo(token, Number(id), payload)
      } else {
        const creado = await crearEquipo(token, payload)
        const nuevoId = creado?.id
        if (quiereCaracteristicas && nuevoId && filasValidas.length > 0) {
          for (const fila of filasValidas) {
            await crearCaracteristica(token, {
              name: fila.name.trim(),
              description: fila.description.trim(),
              equipment_id: nuevoId,
            })
          }
        }
      }
      navigate('/catalogo/equipos')
    } catch (err) {
      setError(err.message || 'No se pudo guardar el equipo')
      setErroresCampo(err.errors || null)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[900px] mx-auto flex flex-col gap-stack-lg">
        <Link
          to="/catalogo/equipos"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Equipos
        </Link>

        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">
            {esEdicion ? 'Editar equipo' : 'Nuevo equipo'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {esEdicion
              ? 'Cambia los datos del equipo y sus características.'
              : 'Registra el equipo y, si quieres, sus características desde ahora.'}
          </p>
        </div>

        {cargando ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-14 justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-outline" strokeWidth={2} />
            <span className="font-body-md text-body-md text-on-surface-variant">
              Cargando equipo...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-stack-lg">
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm flex flex-col gap-stack-md">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                Datos del equipo
              </h2>

              <div className="grid grid-cols-1 gap-column-gap sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-label-bold text-label-bold text-on-surface">Nombre</label>
                  <input
                    className={inputClasses}
                    value={form.name}
                    disabled={guardando}
                    maxLength={255}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Ej. Laptop Dell Latitude"
                    required
                  />
                  {erroresCampo?.name?.[0] && (
                    <p className="font-label-sm text-label-sm text-error">{erroresCampo.name[0]}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-label-bold text-on-surface">Modelo</label>
                  <input
                    className={inputClasses}
                    value={form.model}
                    disabled={guardando}
                    maxLength={255}
                    onChange={(e) => set('model', e.target.value)}
                    placeholder="Ej. Latitude 5440"
                    required
                  />
                  {erroresCampo?.model?.[0] && (
                    <p className="font-label-sm text-label-sm text-error">{erroresCampo.model[0]}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-label-bold text-on-surface">Marca</label>
                  <select
                    className={inputClasses}
                    value={form.brand_id}
                    disabled={guardando}
                    onChange={(e) => set('brand_id', e.target.value)}
                    required
                  >
                    <option value="">Selecciona una marca</option>
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    ¿Falta una?{' '}
                    <Link to="/catalogo/marcas" className="underline hover:text-on-surface">
                      Regístrala en Marcas
                    </Link>
                    .
                  </p>
                  {erroresCampo?.brand_id?.[0] && (
                    <p className="font-label-sm text-label-sm text-error">{erroresCampo.brand_id[0]}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-label-bold text-on-surface">Serie</label>
                  <input
                    className={inputClasses}
                    value={form.serie}
                    disabled={guardando}
                    maxLength={255}
                    onChange={(e) => set('serie', e.target.value)}
                    placeholder="Ej. 5CD1234XYZ"
                    required
                  />
                  {erroresCampo?.serie?.[0] && (
                    <p className="font-label-sm text-label-sm text-error">{erroresCampo.serie[0]}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-label-bold text-on-surface">Tipo</label>
                  <input
                    className={inputClasses}
                    value={form.type}
                    disabled={guardando}
                    maxLength={255}
                    list="tipos-equipo"
                    onChange={(e) => set('type', e.target.value)}
                    placeholder="Ej. laptop"
                    required
                  />
                  <datalist id="tipos-equipo">
                    {TIPOS.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                  {erroresCampo?.type?.[0] && (
                    <p className="font-label-sm text-label-sm text-error">{erroresCampo.type[0]}</p>
                  )}
                </div>

                <ElijeSiNo
                  label="¿Es original?"
                  value={form.original}
                  disabled={guardando}
                  onChange={(v) => set('original', v)}
                />
                <ElijeSiNo
                  label="¿Está usado?"
                  value={form.is_used}
                  disabled={guardando}
                  onChange={(v) => set('is_used', v)}
                />
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm flex flex-col gap-stack-md">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                Características
              </h2>

              {esEdicion ? (
                <CaracteristicasDeEquipo
                  equipmentId={Number(id)}
                  caracteristicas={caracteristicas}
                  cargando={cargandoCaract}
                  onCrear={async (payload) => {
                    await crearCaracteristica(token, payload)
                    await cargarCaracteristicas()
                  }}
                  onActualizar={async (caractId, payload) => {
                    await actualizarCaracteristica(token, caractId, payload)
                    await cargarCaracteristicas()
                  }}
                />
              ) : (
                <>
                  <ElijeSiNo
                    label="¿Desea agregar características?"
                    value={quiereCaracteristicas}
                    disabled={guardando}
                    onChange={setQuiereCaracteristicas}
                    ayuda="Con “No” el equipo se guarda sin características; podrás agregarlas después desde la lista."
                  />

                  {quiereCaracteristicas === true && (
                    <div className="animate-view-in">
                      <FilasCaracteristicas filas={filas} onChange={setFilas} disabled={guardando} />
                    </div>
                  )}
                </>
              )}
            </section>

            {error && (
              <p className="font-label-sm text-label-sm text-error rounded-lg border border-error/30 bg-error-container/40 px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                to="/catalogo/equipos"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={guardando || !completo || hayDuplicadoEnBorrador}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95 disabled:opacity-60"
              >
                {guardando ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Save className="h-4 w-4" strokeWidth={2.25} />
                )}
                {esEdicion ? 'Guardar cambios' : 'Crear equipo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EquipoForm
