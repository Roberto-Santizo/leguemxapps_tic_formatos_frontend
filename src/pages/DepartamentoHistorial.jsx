import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { obtenerDepartamento } from '../services/api.js'
import EstadoVacio from '../components/EstadoVacio.jsx'
import { SkeletonTabla, SkeletonTarjetas } from '../components/Skeleton.jsx'
import HistorialEntregaList from './HistorialEntregaList.jsx'
import HistorialDevolucionList from './HistorialDevolucionList.jsx'

/**
 * Historial de entregas / devoluciones de UN departamento
 * (/catalogo/departamentos/:id/historial/:tipo, con tipo = entrega | devolucion).
 * Se entra desde las tarjetas de Catálogo → Departamentos → ver.
 *
 * Carga el departamento por su id (funciona con URL directa o al recargar) y
 * reutiliza las MISMAS listas del Historial de actas con la prop
 * `departamento`: misma tabla, mismas tarjetas en móvil, mismos filtros.
 *
 * El backend no filtra actas por departamento (paginacion.md §4 y la nota de
 * api.js sobre los filtros de /delivery_documents), así que la lista trae
 * todas y se queda en el cliente con las del departamento, comparando el
 * nombre del departamento con `employee_department` de cada acta. Si algún
 * día el backend expone un filtro por departamento, este es el lugar a cambiar.
 */
const TIPOS = ['entrega', 'devolucion']

const botonVolver =
  'inline-flex h-9 items-center gap-2 self-start rounded-boton border border-outline-variant bg-white px-3 font-body-md text-body-md font-medium text-on-surface transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'
const botonSecundario =
  'inline-flex h-10 items-center justify-center gap-2 rounded-boton border border-outline-variant bg-white px-4 font-body-md text-body-md font-medium text-on-surface shadow-sm transition duration-fast ease-standard hover:bg-surface-container active:scale-[0.97]'

function DepartamentoHistorial() {
  const { id, tipo } = useParams()
  const { token } = useAuth()
  const tipoValido = TIPOS.includes(tipo)

  const [departamento, setDepartamento] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!tipoValido) return undefined
    let vivo = true
    setCargando(true)
    setError('')
    obtenerDepartamento(token, Number(id))
      .then((data) => vivo && setDepartamento(data))
      .catch((err) => vivo && setError(err.message || 'No se pudo cargar el departamento'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [id, token, tipoValido, intento])

  if (tipoValido && !cargando && !error && departamento) {
    return tipo === 'entrega' ? (
      <HistorialEntregaList departamento={departamento} />
    ) : (
      <HistorialDevolucionList departamento={departamento} />
    )
  }

  return (
    <div className="flex-1 animate-view-in px-4 pt-6 pb-10 tablet:px-8 tablet:pt-8 md:px-8 md:pt-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-stack-lg">
        <Link to={`/catalogo/departamentos/${id}/ver`} className={botonVolver}>
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Departamento
        </Link>

        {!tipoValido ? (
          <div className="rounded-tarjeta bg-white shadow-tarjeta">
            <EstadoVacio
              titulo="Este historial no existe"
              descripcion="Solo hay historial de entregas y de devoluciones por departamento."
              accion={
                <Link to={`/catalogo/departamentos/${id}/ver`} className={botonSecundario}>
                  Volver al departamento
                </Link>
              }
            />
          </div>
        ) : error ? (
          <div className="rounded-tarjeta bg-white shadow-tarjeta">
            <EstadoVacio
              variante="error"
              titulo="No se pudo cargar el departamento"
              descripcion={error}
              accion={
                <button type="button" onClick={() => setIntento((n) => n + 1)} className={botonSecundario}>
                  Reintentar
                </button>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-tarjeta bg-white shadow-tarjeta md:block">
              <SkeletonTabla columnas={6} filas={5} />
            </div>
            <div className="flex flex-col gap-stack-sm md:hidden">
              <SkeletonTarjetas filas={4} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DepartamentoHistorial
