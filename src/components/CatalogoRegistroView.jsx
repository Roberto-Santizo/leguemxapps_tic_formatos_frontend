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
 */
function CatalogoRegistroView({ textos, onObtener, rutaBase }) {
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
    <div className="animate-view-in flex-1 p-container-padding md:p-stack-lg bg-background">
      {/* Mismo ancho que su formulario (CatalogoFormPage, 600px): ver y editar
          de una misma entidad no deben cambiar de ancho al pasar de una a otra. */}
      <div className="max-w-[600px] mx-auto flex flex-col gap-stack-md">
        <Link
          to={rutaBase}
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest active:scale-[0.97] transition-transform"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          {textos.titulo}
        </Link>

        {cargando ? (
          <SkeletonDetalle secciones={1} camposPorSeccion={2} />
        ) : error ? (
          // Mismo estado de error que las listas (EstadoVacio con
          // "Reintentar"), en vez de una línea roja suelta sin ninguna salida.
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <EstadoVacio
              variante="error"
              titulo="No se pudo cargar el registro"
              descripcion={error}
              accion={
                <button
                  type="button"
                  onClick={() => setIntento((n) => n + 1)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
                >
                  Reintentar
                </button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">{registro.name}</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Información completa del registro.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} />
                Editar
              </button>
            </div>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-4">Datos del registro</h2>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">ID</p>
                  <p className="font-body-md text-body-md text-on-surface">{registro.id}</p>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                    {textos.colNombre}
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">{registro.name}</p>
                </div>
              </div>
            </section>
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
