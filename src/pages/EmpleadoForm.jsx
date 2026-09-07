import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { mostrarToast } from '../components/Toast.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'
import { SkeletonFormulario } from '../components/Skeleton.jsx'
import { listarDepartamentos, obtenerEmpleado, crearEmpleado, actualizarEmpleado } from '../services/api.js'

/**
 * Alta y edición de un empleado (POST /employees, PUT /employees/{id}).
 * Un solo formulario simple, sin pasos condicionales -- código, nombre y
 * departamento, igual de directo que Marcas/Departamentos. El departamento
 * se elige de los ya registrados con el selector con búsqueda (regla
 * general de catálogo para cualquier campo relacional).
 */

const inputClasses =
  'h-11 w-full rounded-lg border border-outline-variant bg-surface px-3.5 font-body-md text-body-md text-on-surface transition-colors hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60'

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
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[600px] mx-auto flex flex-col gap-stack-lg">
        <Link
          to="/catalogo/empleados"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Empleados
        </Link>

        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
          {esEdicion ? 'Editar empleado' : 'Nuevo empleado'}
        </h1>

        {cargando ? (
          <SkeletonFormulario campos={3} />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-stack-lg">
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm flex flex-col gap-stack-md">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface">Código</label>
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

              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface">Nombre</label>
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

              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface">Departamento</label>
                <SearchableSelect
                  options={departamentos}
                  value={departmentId}
                  onChange={setDepartmentId}
                  disabled={guardando}
                  placeholder="Selecciona un departamento"
                  emptyOptionsText="No hay departamentos registrados todavía."
                />
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  ¿Falta uno?{' '}
                  <Link to="/catalogo/departamentos" className="underline hover:text-on-surface">
                    Regístralo en Departamentos
                  </Link>
                  .
                </p>
              </div>
            </section>

            {error && (
              <p className="font-label-sm text-label-sm text-error rounded-lg border border-error/30 bg-error-container/40 px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                to="/catalogo/empleados"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={guardando || !completo}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-label-bold text-label-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:brightness-95 disabled:opacity-60"
              >
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Save className="h-4 w-4" strokeWidth={2.25} />}
                {esEdicion ? 'Guardar cambios' : 'Crear empleado'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EmpleadoForm
