import { useState } from 'react'
import { Plus, Trash2, Loader2, Check, X } from 'lucide-react'
import InlineEditableText from './InlineEditableText.jsx'
import { mostrarToast } from './Toast.jsx'
import { SkeletonTabla } from './Skeleton.jsx'

/**
 * Características de un equipo, en sus dos situaciones:
 *
 *  - FilasCaracteristicas  → BORRADOR. El equipo todavía no existe (estamos
 *    en el formulario de alta), así que las filas viven en el estado del
 *    padre y no se llama a la API hasta guardar el equipo.
 *
 *  - CaracteristicasDeEquipo → PERSISTIDAS. El equipo ya tiene id: cada alta
 *    o cambio va directo a POST/PUT /caracteristics. La edición es en sitio
 *    con InlineEditableText -- el mismo patrón de "clic para escribir su
 *    nombre" de la firma en Devolución -- en vez de abrir un modal.
 *
 * Regla de negocio compartida: dentro de un mismo equipo no puede haber dos
 * características con el mismo nombre. Se valida aquí, en el cliente, porque
 * la API no lo rechaza.
 */

const inputClasses =
  'h-11 w-full rounded-lg border border-outline-variant bg-surface px-3.5 font-body-md text-body-md text-on-surface transition-colors hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60'

export function hayNombreRepetido(nombre, nombresExistentes, ignorar = '') {
  const limpio = (nombre || '').trim().toLowerCase()
  if (!limpio) return false
  return nombresExistentes
    .filter((n) => (n || '').trim().toLowerCase() !== (ignorar || '').trim().toLowerCase())
    .some((n) => (n || '').trim().toLowerCase() === limpio)
}

// --------------------------------------------------------------------------
// Borrador: filas repetibles antes de que el equipo exista
// --------------------------------------------------------------------------

// `nombresExistentes`: características ya guardadas del equipo, para que el
// aviso de nombre repetido también las cuente (en el alta del equipo todavía
// no hay ninguna). `autoFocusPrimera`: pone el cursor en la primera fila al
// abrirse, como al agregar características a un equipo que ya existe.
export function FilasCaracteristicas({ filas, onChange, disabled, nombresExistentes = [], autoFocusPrimera = false }) {
  function actualizar(indice, campo, valor) {
    onChange(filas.map((f, i) => (i === indice ? { ...f, [campo]: valor } : f)))
  }

  function agregar() {
    onChange([...filas, { name: '', description: '' }])
  }

  function eliminar(indice) {
    onChange(filas.filter((_, i) => i !== indice))
  }

  return (
    <div className="flex flex-col gap-stack-sm">
      {filas.map((fila, indice) => {
        const repetida = hayNombreRepetido(
          fila.name,
          nombresExistentes.concat(filas.filter((_, i) => i !== indice).map((f) => f.name)),
        )
        return (
          <div
            key={indice}
            className="animate-view-in rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
          >
            <div className="flex flex-col gap-stack-sm sm:flex-row sm:items-start">
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface">Característica</label>
                <input
                  className={inputClasses}
                  value={fila.name}
                  disabled={disabled}
                  maxLength={255}
                  autoFocus={autoFocusPrimera && indice === 0}
                  onChange={(e) => actualizar(indice, 'name', e.target.value)}
                  placeholder="Ej. Memoria RAM"
                />
                {repetida && (
                  <p className="font-label-sm text-label-sm text-error">
                    Ya hay una característica con ese nombre en este equipo.
                  </p>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface">Descripción</label>
                <input
                  className={inputClasses}
                  value={fila.description}
                  disabled={disabled}
                  maxLength={255}
                  onChange={(e) => actualizar(indice, 'description', e.target.value)}
                  placeholder="Ej. 16 GB DDR5"
                />
              </div>

              <button
                type="button"
                onClick={() => eliminar(indice)}
                disabled={disabled || filas.length === 1}
                aria-label="Quitar característica"
                title={filas.length === 1 ? 'Debe quedar al menos una fila' : 'Quitar'}
                className="grid h-11 w-11 shrink-0 place-items-center self-end rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-transparent sm:mt-[26px] sm:self-start active:scale-[0.90] transition-transform"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={agregar}
        disabled={disabled}
        className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg border border-dashed border-outline px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60 active:scale-[0.97] transition-transform"
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} />
        Agregar otra
      </button>
    </div>
  )
}

// --------------------------------------------------------------------------
// Persistidas: lista editable en sitio + alta contra la API
// --------------------------------------------------------------------------

export function CaracteristicasDeEquipo({
  equipmentId,
  caracteristicas,
  cargando,
  soloLectura = false,
  iniciarAgregando = false,
  onCrear,
  onActualizar,
}) {
  const [agregando, setAgregando] = useState(iniciarAgregando)
  // Varias filas antes de guardar, igual que en el alta del equipo: el
  // usuario puede pulsar "Agregar otra" tantas veces como necesite.
  const [nuevas, setNuevas] = useState([{ name: '', description: '' }])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const nombres = caracteristicas.map((c) => c.name)

  function cerrarAlta() {
    setAgregando(false)
    setNuevas([{ name: '', description: '' }])
    setError('')
  }

  async function confirmarNueva() {
    const filas = nuevas
      .map((f) => ({ name: f.name.trim(), description: f.description.trim() }))
      .filter((f) => f.name || f.description)

    if (filas.length === 0) {
      setError('Escribe al menos una característica.')
      return
    }
    if (filas.some((f) => !f.name || !f.description)) {
      setError('Cada fila necesita nombre y descripción.')
      return
    }
    const repetida = filas.find((f, i) =>
      hayNombreRepetido(f.name, nombres.concat(filas.filter((_, j) => j !== i).map((x) => x.name))),
    )
    if (repetida) {
      setError(`Ya hay una característica llamada “${repetida.name}” en este equipo.`)
      return
    }

    setGuardando(true)
    setError('')
    try {
      // La API crea de una en una (POST /caracteristics), así que se envían
      // en serie para que el orden de la lista sea el que escribió el usuario.
      for (const fila of filas) {
        await onCrear({ ...fila, equipment_id: equipmentId })
      }
      cerrarAlta()
      mostrarToast(filas.length > 1 ? 'Características guardadas' : 'Característica guardada')
    } catch (err) {
      setError(err.message || 'No se pudo guardar la característica')
    } finally {
      setGuardando(false)
    }
  }

  async function editarCampo(caracteristica, campo, valor) {
    if (campo === 'name' && hayNombreRepetido(valor, nombres, caracteristica.name)) {
      setError('Ya hay una característica con ese nombre en este equipo.')
      return
    }
    setError('')
    try {
      await onActualizar(caracteristica.id, {
        name: campo === 'name' ? valor : caracteristica.name,
        description: campo === 'description' ? valor : caracteristica.description,
        equipment_id: equipmentId,
      })
      mostrarToast('Característica actualizada')
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la característica')
    }
  }

  // Filas fantasma con la forma de la lista de características (nombre y
  // descripción), en vez de una rueda girando -- mismo criterio que el resto
  // del sistema, para que el contenido no salte al llegar los datos.
  if (cargando) {
    return <SkeletonTabla columnas={2} filas={2} />
  }

  return (
    <div className="flex flex-col gap-stack-sm">
      {caracteristicas.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          No tiene características.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-outline-variant">
          {caracteristicas.map((c) => (
            <li key={c.id} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 py-2.5">
              {soloLectura ? (
                <>
                  <span className="font-label-bold text-label-bold text-on-surface">{c.name}:</span>
                  <span className="font-body-md text-body-md text-on-surface-variant break-words">
                    {c.description}
                  </span>
                </>
              ) : (
                <>
                  <InlineEditableText
                    value={c.name}
                    onChange={(v) => editarCampo(c, 'name', v)}
                    title="Clic para editar el nombre"
                    className="font-label-bold text-label-bold text-on-surface"
                  />
                  <span className="font-label-bold text-label-bold text-on-surface">:</span>
                  <InlineEditableText
                    value={c.description}
                    onChange={(v) => editarCampo(c, 'description', v)}
                    title="Clic para editar la descripción"
                    className="font-body-md text-body-md text-on-surface-variant"
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!soloLectura && (
        <>
          {agregando ? (
            <div className="animate-view-in flex flex-col gap-stack-sm rounded-xl border border-outline-variant bg-surface-container-low p-3.5">
              {/* Misma tarjeta con títulos ("Característica" / "Descripción")
                  que en el alta del equipo. Antes aquí eran dos cajas sin
                  título, con la guía solo como texto gris adentro -- que
                  desaparece al escribir --, y en móvil (una caja encima de la
                  otra) ya no se sabía cuál era cuál. Ahora hay una sola forma
                  de cargar características en todo el sistema. */}
              <FilasCaracteristicas
                filas={nuevas}
                onChange={(filas) => {
                  setError('')
                  setNuevas(filas)
                }}
                disabled={guardando}
                nombresExistentes={nombres}
                autoFocusPrimera
              />

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={confirmarNueva}
                  disabled={guardando}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95 active:scale-[0.97] disabled:opacity-60"
                >
                  {guardando ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <Check className="h-4 w-4" strokeWidth={2.25} />
                  )}
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={cerrarAlta}
                  disabled={guardando}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60 active:scale-[0.97] transition-transform"
                >
                  <X className="h-4 w-4" strokeWidth={2.25} />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAgregando(true)}
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-dashed border-outline px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Agregar característica
            </button>
          )}

          {error && (
            <p className="font-label-sm text-label-sm text-error rounded-lg border border-error/30 bg-error-container/40 px-3 py-2">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  )
}
