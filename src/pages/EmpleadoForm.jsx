import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { IndicadorGuardando, mostrarToast } from '../components/Toast.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'
import { SkeletonFormulario } from '../components/Skeleton.jsx'
import { listarDepartamentos, obtenerEmpleado, crearEmpleado, actualizarEmpleado } from '../services/api.js'
import IsotipoCarga from '../components/IsotipoCarga.jsx'
/**
 * Alta y edición de un empleado (POST /employees, PUT /employees/{id}).
 * Un solo formulario simple, sin pasos condicionales -- código, nombre y
 * departamento, igual de directo que Marcas/Departamentos. El departamento
 * se elige de los ya registrados con el selector con búsqueda (regla
 * general de catálogo para cualquier campo relacional).
 */

// Recetas visuales "Sierra" (BRIEF, ola 2), repetidas a propósito.
const inputClasses =
  'h-11 w-full rounded-boton border border-outline-variant bg-white px-3 font-body-md text-input-movil text-on-surface placeholder:text-on-surface-subtle transition duration-fast ease-standard hover:[&:not(:focus)]:border-outline disabled:opacity-60 md:text-body-md'
const labelClasses = 'text-meta font-semibold leading-4 text-on-surface'
const botonVolver =
  'inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const botonSecundario =
  'inline-flex h-10 items-center justify-center gap-2 rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const botonPrimario =
  'inline-flex h-10 items-center justify-center gap-2 rounded-boton bg-tinta px-4 font-body-md text-body-md font-medium text-white shadow-sm transition duration-fast ease-standard hover:bg-tinta-hover active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100'

function EmpleadoForm() {
  const { id } = useParams()
  const esEdicion = Boolean(id)
  const navigate = useNavigate()
  const { token } = useAuth()

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [erroresCampo, setErroresCampo] = useState(null)

  useEffect(() => {
    let vivo = true
    listarDepartamentos(token)
      .then((data) => vivo && setDepartamentos(Array.isArray(data) ? data : []))
      .catch(() => vivo && setDepartamentos([]))
    return () => {
      vivo = false
    }
  }, [token])

  useEffect(() => {
    if (!esEdicion) return
    let vivo = true
    setCargando(true)
    obtenerEmpleado(token, Number(id))
      .then((emp) => {
        if (!vivo || !emp) return
        setCode(emp.code ?? '')
        setName(emp.name ?? '')
        setDepartmentId(emp.department_id != null ? String(emp.department_id) : '')
      })
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el empleado'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [esEdicion, id, token])

  const completo = code.trim() && name.trim() && departmentId

  async function handleSubmit(e) {
    e.preventDefault()
    if (!completo) return
    setGuardando(true)
    setError('')
    setErroresCampo(null)
    const payload = { code: code.trim(), name: name.trim(), department_id: Number(departmentId) }
    try {
      if (esEdicion) {
        await actualizarEmpleado(token, Number(id), payload)
      } else {
        await crearEmpleado(token, payload)
      }
      mostrarToast(esEdicion ? 'Empleado actualizado' : 'Empleado creado')
      navigate('/catalogo/empleados')
    } catch (err) {
      setError(err.message || 'No se pudo guardar el empleado')
      // Igual que EquipoForm: si la API señala el campo (p. ej. código
      // repetido), se marca debajo del campo y no solo en el aviso general.
      setErroresCampo(err.errors || null)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="animate-view-in flex-1 px-4 pt-6 pb-10 md:px-8 md:pt-10">
      {/* Mismo carril de 1200px que la lista del catálogo (ver y editar no
          cambian de ancho respecto a ella). */}
      <div className="mx-auto flex max-w-[1200px] flex-col gap-stack-lg">
        <Link to="/catalogo/empleados" className={botonVolver}>
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Empleados
        </Link>

        <div className="-mt-1 md:mt-0">
          <div className="flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
            <span aria-hidden="true" className="h-px w-7 bg-outline" />
            Catálogo / Empleados / {esEdicion ? 'Editar' : 'Nuevo'}
          </div>
          <h1 className="mt-1.5 font-display-lg text-titulo-movil text-on-surface md:text-display-lg">
            {esEdicion ? 'Editar empleado' : 'Nuevo empleado'}
          </h1>
        </div>

        {cargando ? (
          <SkeletonFormulario campos={3} />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 rounded-tarjeta bg-white p-4 shadow-tarjeta md:p-6"
          >
            {/* Desde lg: Código · Nombre · Departamento en una fila (el código
                es corto), en vez de tres campos estirados a lo ancho. */}
            <section className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)]">
              <div className="flex flex-col gap-2">
                <label className={labelClasses}>Código</label>
                <input
                  className={inputClasses}
                  value={code}
                  disabled={guardando}
                  maxLength={255}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej. EMP-001"
                  required
                />
                {erroresCampo?.code?.[0] && (
                  <p className="font-label-sm text-label-sm text-error">{erroresCampo.code[0]}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelClasses}>Nombre</label>
                <input
                  className={inputClasses}
                  value={name}
                  disabled={guardando}
                  maxLength={255}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Roberto Santizo"
                  required
                />
                {erroresCampo?.name?.[0] && (
                  <p className="font-label-sm text-label-sm text-error">{erroresCampo.name[0]}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelClasses}>Departamento</label>
                <SearchableSelect
                  options={departamentos}
                  value={departmentId}
                  onChange={setDepartmentId}
                  disabled={guardando}
                  placeholder="Selecciona un departamento"
                  emptyOptionsText="No hay departamentos registrados todavía."
                />
                <p className="text-meta leading-4 text-on-surface-subtle">
                  ¿Falta uno?{' '}
                  <Link
                    to="/catalogo/departamentos"
                    className="font-medium text-foco underline-offset-2 hover:text-foco-hover hover:underline"
                  >
                    Regístralo en Departamentos
                  </Link>
                  .
                </p>
              </div>
            </section>

            {error && (
              <p className="animate-hint-in font-label-sm text-label-sm text-error rounded-boton border border-error/30 bg-error-container/40 px-3 py-2">
                {error}
              </p>
            )}

            {/* Fila de botones: filete arriba y, como antes del rediseño,
                Cancelar + primario alineados a la derecha (en móvil el
                primario queda arriba, a todo lo ancho). */}
            <div className="flex flex-col-reverse gap-3 border-t border-outline-variant pt-5 sm:flex-row sm:justify-end">
              <Link to="/catalogo/empleados" className={botonSecundario}>
                Cancelar
              </Link>
              <button type="submit" disabled={guardando || !completo} className={botonPrimario}>
                {guardando ? <IsotipoCarga className="h-3" /> : <Save className="h-4 w-4" strokeWidth={1.75} />}
                {esEdicion ? 'Guardar cambios' : 'Crear empleado'}
              </button>
            </div>
          </form>
        )}
      </div>

      <IndicadorGuardando activo={guardando} />
    </div>
  )
}

export default EmpleadoForm
