import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CircleUser,
  Laptop,
  Loader2,
  Lock,
  MessageSquareText,
  PenLine,
  PlusCircle,
  Rows3,
  Smartphone,
  X,
} from 'lucide-react'
import FirmaPad from '../components/FirmaPad.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'
import InlineEditableText from '../components/InlineEditableText.jsx'
import { mostrarToast } from '../components/Toast.jsx'
import useLocalStorageState from '../hooks/useLocalStorageState.js'
import { getFormato, VIGENCIA_DOCUMENTOS, VIGENCIA_DOCUMENTOS_STORAGE_KEY } from '../config/formatos.js'
import EnConstruccion from '../components/EnConstruccion.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { listarEmpleados, listarDepartamentos, listarEquiposDisponibles, crearDocumentoEntrega } from '../services/api.js'

// Convierte el dataURL (base64) que entrega FirmaPad a un Blob, para poder
// mandarlo como archivo dentro del FormData de POST /delivery_documents.
function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(',')
  const mime = meta.match(/:(.*?);/)[1]
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/*
  Motor único de actas.

  Los seis formatos físicos comparten estructura, así que en vez de seis
  páginas casi idénticas hay una sola que se configura desde
  config/formatos.js según el :tipo de la URL. Todo el formulario vive en una
  misma pantalla (sin navegador de páginas): la hoja de responsabilidad es de
  dos hojas en papel, pero en pantalla se llena de corrido.
*/

const PLANTAS = ['Tejar', 'Parramos']

// --- Piezas de UI compartidas -------------------------------------------

function Campo({ label, children, span = 'col-span-12 sm:col-span-4' }) {
  return (
    <div className={`${span} flex flex-col gap-1.5`}>
      <label className="font-label-bold text-label-bold text-on-surface">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-lg border-outline-variant bg-surface-container-lowest px-3.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 transition-colors hover:border-outline focus:border-primary focus:ring-2 focus:ring-primary/25'

const inputMonoClass = `${inputClass} font-mono uppercase`

const celdaInputClass =
  'w-full border-0 border-b border-transparent bg-transparent p-1 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-0'

function SeccionCard({ icon: Icon, titulo, nota, acciones, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-5 py-3">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="h-4.5 w-4.5 shrink-0 text-primary" strokeWidth={2} />}
          <h3 className="font-label-bold text-label-bold uppercase tracking-wide text-on-surface">
            {titulo}
          </h3>
          {nota && (
            <span className="font-label-sm text-label-sm text-on-surface-variant">{nota}</span>
          )}
        </div>
        {acciones}
      </header>
      {children}
    </section>
  )
}

// Campo en blanco dentro de un párrafo legal: reproduce el "____" de la
// hoja impresa, pero se puede escribir encima.
function Blanco({ ancho = 'w-52', placeholder = '', mono = false }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className={[
        ancho,
        mono ? 'font-mono' : 'font-body-md',
        'mx-1 border-0 border-b border-dashed border-outline bg-transparent p-0 text-center font-bold text-body-md text-on-surface placeholder:font-normal placeholder:text-on-surface-variant/70 focus:border-solid focus:border-primary focus:ring-0',
      ].join(' ')}
    />
  )
}

function Parrafo({ children }) {
  return (
    <p className="border-l-2 border-outline-variant pl-4 font-body-md text-body-md leading-relaxed text-pretty text-on-surface">
      {children}
    </p>
  )
}

// --- Página --------------------------------------------------------------

function FormatoActa() {
  const { tipo } = useParams()
  const navigate = useNavigate()
  const formato = getFormato(tipo)
  const esEntrega = formato?.id === 'entrega'
  const { token, omitirConfirmacion, marcarOmitirConfirmacion } = useAuth()

  const hojaRef = useRef(null)

  const [planta, setPlanta] = useLocalStorageState('acta:planta', 'Tejar')
  const [tipoEquipo, setTipoEquipo] = useState('Laptop')
  const [estadoEquipo, setEstadoEquipo] = useState('Nuevo')
  const [marcaEquipo, setMarcaEquipo] = useState('Original')
  const [modalidad, setModalidad] = useState('dos') // 'una' | 'dos' (solo devolución)
  const [tipoEntregaTel, setTipoEntregaTel] = useState('Nueva')
  const [accesoriosSeleccionados, setAccesoriosSeleccionados] = useState([])
  const [filas, setFilas] = useState([])
  const [observaciones, setObservaciones] = useState('')
  const [firmas, setFirmas] = useState({})

  // --- Solo "Entrega de Equipo": es el único formato conectado hoy a la API
  // real (POST /delivery_documents). El resto sigue como borrador visual. ---
  // Vigencia editorial del formato (Emisión/Vigencia del membrete) -- editable
  // con un clic (ver render abajo); persiste en localStorage porque el
  // backend todavía no tiene un endpoint de configuración para esto.
  const [vigenciaDocumentos, setVigenciaDocumentos] = useLocalStorageState(
    VIGENCIA_DOCUMENTOS_STORAGE_KEY,
    VIGENCIA_DOCUMENTOS,
  )
  const [empleados, setEmpleados] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [cargandoCatalogos, setCargandoCatalogos] = useState(esEntrega)
  const [empleadoId, setEmpleadoId] = useState('')
  const [filasEntrega, setFilasEntrega] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  // Pide confirmación antes de guardar la entrega -- antes "Finalizar
  // Entrega" guardaba directo con un solo clic, sin preguntar. Trae su
  // propio "no volver a preguntar en esta sesión" (ver AuthContext), útil
  // cuando se están llenando varias entregas seguidas.
  const [confirmandoFinalizar, setConfirmandoFinalizar] = useState(false)

  useEffect(() => {
    if (!esEntrega) return
    let vivo = true
    setCargandoCatalogos(true)
    // Solo equipo SIN entrega activa: nunca entregado, o ya devuelto de su
    // última entrega. Antes se usaba listarEquipos (todo el inventario) y se
    // podía elegir por error un equipo que ya tenía otro colaborador.
    Promise.all([listarEmpleados(token), listarDepartamentos(token), listarEquiposDisponibles(token)])
      .then(([emp, dep, eq]) => {
        if (!vivo) return
        setEmpleados(Array.isArray(emp) ? emp : [])
        setDepartamentos(Array.isArray(dep) ? dep : [])
        setEquipos(Array.isArray(eq) ? eq : [])
      })
      .catch((err) => vivo && setErrorGuardar(err.message || 'No se pudieron cargar los catálogos'))
      .finally(() => vivo && setCargandoCatalogos(false))
    return () => {
      vivo = false
    }
  }, [esEntrega, token])

  const empleadoSeleccionado = empleados.find((e) => String(e.id) === String(empleadoId))
  const departamentoAuto = empleadoSeleccionado
    ? empleadoSeleccionado.department ||
      departamentos.find((d) => d.id === empleadoSeleccionado.department_id)?.name ||
      '—'
    : ''

  function agregarFilaEntrega() {
    setFilasEntrega((f) => [
      ...f,
      { id: `fila-entrega-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, equipmentId: '', observaciones: '' },
    ])
  }

  function actualizarFilaEntrega(id, campo, valor) {
    setFilasEntrega((f) => f.map((fila) => (fila.id === id ? { ...fila, [campo]: valor } : fila)))
  }

  function quitarFilaEntrega(id) {
    setFilasEntrega((f) => f.filter((x) => x.id !== id))
  }

  // Valida lo mismo que antes validaba handleFinalizarEntrega, pero sin
  // guardar todavía -- eso permite meter la confirmación en medio: primero
  // se valida, y solo si está todo completo tiene sentido preguntar
  // "¿seguro?" (un formulario incompleto simplemente muestra su error, igual
  // que siempre).
  function validarEntrega() {
    setErrorGuardar('')
    if (!empleadoId) {
      setErrorGuardar('Selecciona el colaborador que recibe el equipo.')
      return false
    }
    if (filasEntrega.filter((f) => f.equipmentId).length === 0) {
      setErrorGuardar('Agrega al menos un equipo entregado.')
      return false
    }
    if (!firmas.responsable || !firmas.it) {
      setErrorGuardar('Faltan firmas por confirmar.')
      return false
    }
    return true
  }

  function handleClicFinalizarEntrega() {
    if (!validarEntrega()) return
    if (omitirConfirmacion.entrega) {
      handleFinalizarEntrega()
      return
    }
    setConfirmandoFinalizar(true)
  }

  function handleConfirmarFinalizarEntrega(_password, noPreguntar) {
    if (noPreguntar) marcarOmitirConfirmacion('entrega')
    setConfirmandoFinalizar(false)
    handleFinalizarEntrega()
  }

  async function handleFinalizarEntrega() {
    const itemsValidos = filasEntrega.filter((f) => f.equipmentId)

    setGuardando(true)
    try {
      const formData = new FormData()
      formData.append('location', planta === 'Tejar' ? '1' : '2')
      formData.append('employee_id', empleadoId)
      if (observaciones.trim()) formData.append('observations', observaciones.trim())
      formData.append('responsable_signature', dataUrlToBlob(firmas.responsable), 'responsable.png')
      formData.append('administrador_signature', dataUrlToBlob(firmas.it), 'administrador.png')
      itemsValidos.forEach((fila, indice) => {
        formData.append(`items[${indice}][equipment_id]`, fila.equipmentId)
        if (fila.observaciones.trim()) {
          formData.append(`items[${indice}][observations]`, fila.observaciones.trim())
        }
      })
      await crearDocumentoEntrega(token, formData)
      // Confirmación explícita: antes el único indicio de que se había
      // guardado era el cambio de pantalla.
      mostrarToast('Entrega registrada')
      navigate('/historial/entrega')
    } catch (err) {
      setErrorGuardar(err.message || 'No se pudo guardar la entrega')
    } finally {
      setGuardando(false)
    }
  }

  const dosPaginas = modalidad === 'dos'

  const mostrarFicha = useMemo(() => {
    if (!formato) return false
    if (formato.fichaSiempre) return true
    return Boolean(formato.tieneModalidad && dosPaginas)
  }, [formato, dosPaginas])

  const tituloTabla = useMemo(() => {
    if (!formato) return ''
    if (formato.tieneModalidad) {
      return dosPaginas ? formato.tituloTablaLarga : formato.tituloTablaCorta
    }
    return formato.tituloTablaCorta
  }, [formato, dosPaginas])

  if (!formato) {
    return (
      <EnConstruccion
        icon={Rows3}
        titulo="Formato no encontrado"
        descripcion="El formato solicitado no existe. Vuelve al menú de Nueva Acta y elige uno de los formatos disponibles."
      />
    )
  }

  // Marcar un accesorio agrega su fila; desmarcarlo la quita. Igual que en
  // la Hoja de Devolución original.
  function toggleAccesorio(nombre) {
    setAccesoriosSeleccionados((previos) => {
      const yaEsta = previos.includes(nombre)
      if (yaEsta) {
        setFilas((f) => f.filter((fila) => fila.articulo !== nombre))
        return previos.filter((a) => a !== nombre)
      }
      setFilas((f) => [...f, nuevaFila(nombre)])
      return [...previos, nombre]
    })
  }

  function nuevaFila(articulo = '') {
    return {
      id: `fila-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      articulo,
      marca: '',
      modelo: '',
      serie: '',
      detalle: formato.colFinalTipo === 'select' ? 'Nuevo' : '',
    }
  }

  function agregarFila() {
    setFilas((f) => [...f, nuevaFila()])
  }

  function actualizarFila(id, campo, valor) {
    setFilas((f) => f.map((fila) => (fila.id === id ? { ...fila, [campo]: valor } : fila)))
  }

  function quitarFila(id) {
    const fila = filas.find((f) => f.id === id)
    setFilas((f) => f.filter((x) => x.id !== id))
    if (fila?.articulo) {
      setAccesoriosSeleccionados((prev) => prev.filter((a) => a !== fila.articulo))
    }
  }

  function vaciarTabla() {
    setFilas([])
    setAccesoriosSeleccionados([])
  }

  return (
    <div className="flex-1 animate-view-in">
      <div ref={hojaRef} className="p-container-padding md:p-8">
        <div className="mx-auto max-w-4xl space-y-stack-lg pb-4">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-high px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:border-outline hover:bg-surface-container-highest active:bg-surface-dim"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Nueva Acta
          </Link>

          {/* Membrete */}
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-column-gap p-stack-lg">
              <div className="flex items-start gap-stack-md">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-outline-variant bg-surface-container-lowest p-1.5">
                  <img
                    src="/logo-legumex-icon.png"
                    alt="Agroindustria Legumex"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                    Agroindustria Legumex, S.A.
                  </p>
                  <h2 className="mt-1 font-headline-lg text-headline-lg font-extrabold text-on-surface">
                    {formato.titulo}
                  </h2>
                  <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                    Departamento de Tecnologías de la Información
                  </p>
                </div>
              </div>

              <dl className="grid shrink-0 grid-cols-[auto_auto] items-baseline gap-x-4 gap-y-1.5 text-right">
                <dt className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
                  Código
                </dt>
                <dd className="font-mono text-label-bold text-on-surface">{formato.codigo}</dd>
                <dt className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
                  Emisión
                </dt>
                <dd className="font-label-bold text-label-bold text-on-surface">
                  <InlineEditableText
                    value={vigenciaDocumentos.emision}
                    onChange={(valor) => setVigenciaDocumentos((v) => ({ ...v, emision: valor }))}
                    title="Clic para corregir la fecha de emisión"
                  />
                </dd>
                <dt className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
                  Vigencia
                </dt>
                <dd className="font-label-bold text-label-bold text-on-surface">
                  <InlineEditableText
                    value={vigenciaDocumentos.vigencia}
                    onChange={(valor) => setVigenciaDocumentos((v) => ({ ...v, vigencia: valor }))}
                    title="Clic para corregir la fecha de vigencia"
                  />
                </dd>
              </dl>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-low px-stack-lg py-3">
              <div>
                <p className="font-label-bold text-label-bold text-on-surface">Formato del acta</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {formato.tieneModalidad
                    ? dosPaginas
                      ? 'Incluye la ficha técnica completa del equipo.'
                      : 'Versión corta: solo accesorios y constancia con DPI.'
                    : formato.meta}
                </p>
              </div>

              {formato.tieneModalidad ? (
                <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container-lowest p-1">
                  {[
                    { id: 'una', label: '1 página' },
                    { id: 'dos', label: '2 páginas' },
                  ].map((opcion) => (
                    <button
                      key={opcion.id}
                      type="button"
                      onClick={() => setModalidad(opcion.id)}
                      className={[
                        'rounded px-3.5 py-1.5 font-label-bold text-label-bold transition-colors active:scale-[0.97] transition-transform',
                        modalidad === opcion.id
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface',
                      ].join(' ')}
                    >
                      {opcion.label}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="inline-flex items-center rounded-full border border-outline-variant px-2.5 py-1 font-label-bold text-label-bold text-on-surface-variant">
                  {formato.id === 'responsabilidad' ? 'Formato de 2 páginas' : 'Página 1 de 1'}
                </span>
              )}
            </div>
          </div>

          {/* Datos del usuario */}
          <SeccionCard icon={CircleUser} titulo="Datos del Usuario">
            <div className="grid grid-cols-12 gap-x-column-gap gap-y-stack-md p-5">
              <Campo label={formato.labelFecha}>
                {esEntrega ? (
                  <>
                    <input type="date" disabled className={`${inputClass} opacity-60`} />
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      La fecha la asigna el sistema al guardar
                    </p>
                  </>
                ) : (
                  <input type="date" className={inputClass} />
                )}
              </Campo>

              <Campo label={formato.labelResponsable} span="col-span-12 sm:col-span-8">
                {esEntrega ? (
                  <SearchableSelect
                    options={empleados.map((e) => ({ id: e.id, name: e.code ? `${e.code} — ${e.name}` : e.name }))}
                    value={empleadoId}
                    onChange={setEmpleadoId}
                    disabled={cargandoCatalogos}
                    placeholder="Selecciona el colaborador que recibe"
                    emptyOptionsText="No hay empleados registrados en el catálogo todavía."
                  />
                ) : (
                  <input type="text" placeholder="Nombre completo" className={inputClass} />
                )}
              </Campo>

              {formato.tieneDepartamento && (
                <Campo label="Departamento">
                  {esEntrega ? (
                    <>
                      <div className="flex h-11 items-center gap-2 border-b border-outline-variant">
                        <Lock className="h-4 w-4 shrink-0 text-on-surface-variant" strokeWidth={2} />
                        <span className="font-body-md text-body-md text-on-surface">
                          {departamentoAuto || 'Selecciona un colaborador primero'}
                        </span>
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        Se completa solo, según el colaborador
                      </p>
                    </>
                  ) : (
                    <input type="text" placeholder="Área o departamento" className={inputClass} />
                  )}
                </Campo>
              )}

              {formato.tienePuesto && (
                <Campo label="Puesto">
                  <input type="text" placeholder="Cargo actual" className={inputClass} />
                </Campo>
              )}

              {formato.tieneRecibiDe && (
                <Campo label="Recibí de">
                  <div className="flex h-11 items-center gap-2 border-b border-outline-variant">
                    <Lock className="h-4 w-4 shrink-0 text-on-surface-variant" strokeWidth={2} />
                    <span className="font-body-md text-body-md text-on-surface">
                      AGROINDUSTRIA LEGUMEX, S.A.
                    </span>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Valor fijo del sistema
                  </p>
                </Campo>
              )}

              <div className="col-span-12 flex flex-col gap-stack-sm pt-1">
                <label className="font-label-bold text-label-bold text-on-surface">Planta</label>
                <div className="flex flex-wrap gap-stack-sm">
                  {PLANTAS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlanta(p)}
                      className={[
                        'inline-flex h-11 items-center rounded-lg border px-4 font-label-bold text-label-bold transition-colors active:scale-[0.97] transition-transform',
                        planta === p
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-high',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SeccionCard>

          {/* Ficha técnica */}
          {mostrarFicha && (
            <SeccionCard icon={Laptop} titulo="Descripción de Equipo">
              <div className="grid grid-cols-12 gap-x-column-gap gap-y-stack-md border-b border-outline-variant p-5">
                {[
                  { label: 'Tipo de Equipo', valor: tipoEquipo, set: setTipoEquipo, opciones: ['Laptop', 'Escritorio'] },
                  { label: 'Estado', valor: estadoEquipo, set: setEstadoEquipo, opciones: ['Nuevo', 'Usado'] },
                  { label: 'Marca', valor: marcaEquipo, set: setMarcaEquipo, opciones: ['Original', 'CLON'] },
                ].map((grupo) => (
                  <div key={grupo.label} className="col-span-12 flex flex-col gap-stack-sm sm:col-span-4">
                    <label className="font-label-bold text-label-bold text-on-surface">
                      {grupo.label}
                    </label>
                    <div className="flex gap-stack-sm">
                      {grupo.opciones.map((opcion) => (
                        <button
                          key={opcion}
                          type="button"
                          onClick={() => grupo.set(opcion)}
                          className={[
                            'h-11 flex-1 rounded-lg border font-label-bold text-label-bold transition-colors active:scale-[0.97] transition-transform',
                            grupo.valor === opcion
                              ? 'border-primary bg-primary text-on-primary'
                              : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-high',
                          ].join(' ')}
                        >
                          {opcion}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-12 gap-x-column-gap gap-y-stack-md p-5">
                <Campo label="Modelo">
                  <input type="text" placeholder="Ej. Latitude 5420" className={inputClass} />
                </Campo>
                <Campo label="No. de Serie (S/N)">
                  <input type="text" placeholder="ALFANUMERICO" className={inputMonoClass} />
                </Campo>
                <Campo label="Nombre del Equipo">
                  <input type="text" placeholder="LGMX-NB-001" className={`${inputClass} font-mono`} />
                </Campo>
                <Campo label="Procesador">
                  <input type="text" placeholder="Ej. Intel Core i5 11th Gen" className={inputClass} />
                </Campo>
                <Campo label="Memoria RAM">
                  <input type="text" placeholder="Ej. 8 GB, 16 GB..." className={inputClass} />
                </Campo>
                <Campo label="Disco Duro">
                  <div className="flex gap-stack-sm">
                    <select className={`${inputClass} w-24 shrink-0 px-2.5 font-label-bold text-label-bold`}>
                      <option>SSD</option>
                      <option>HDD</option>
                    </select>
                    <input type="text" placeholder="Capacidad (Ej. 512GB)" className={inputClass} />
                  </div>
                </Campo>
              </div>
            </SeccionCard>
          )}

          {/* Teléfono */}
          {formato.tieneTelefono && (
            <>
              <SeccionCard
                icon={Smartphone}
                titulo="Teléfono Entregado"
                acciones={
                  <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container-lowest p-1">
                    {['Nueva', 'Renovación'].map((opcion) => (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() => setTipoEntregaTel(opcion)}
                        className={[
                          'rounded px-3.5 py-1.5 font-label-bold text-label-bold transition-colors active:scale-[0.97] transition-transform',
                          tipoEntregaTel === opcion
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface',
                        ].join(' ')}
                      >
                        {opcion}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="grid grid-cols-12 gap-x-column-gap gap-y-stack-md p-5">
                  <Campo label="Marca">
                    <input type="text" placeholder="Ej. Samsung" className={inputClass} />
                  </Campo>
                  <Campo label="Modelo">
                    <input type="text" placeholder="Ej. Galaxy A15" className={inputClass} />
                  </Campo>
                  <Campo label="IMEI">
                    <input type="text" placeholder="15 dígitos" className={`${inputClass} font-mono`} />
                  </Campo>
                  <Campo label="Número asignado">
                    <input type="text" placeholder="0000-0000" className={`${inputClass} font-mono`} />
                  </Campo>
                  <Campo label="Tiempo de contrato">
                    <input type="text" placeholder="Ej. 18 meses" className={inputClass} />
                  </Campo>
                </div>

                <div className="border-t border-outline-variant p-5">
                  <p className="mb-3 font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
                    Plan tarifario
                  </p>
                  <div className="grid grid-cols-2 gap-column-gap sm:grid-cols-4">
                    <Campo label="Cuota" span="">
                      <input type="text" placeholder="Q 0.00" className={`${inputClass} font-mono`} />
                    </Campo>
                    <Campo label="Minutos" span="">
                      <input type="text" placeholder="Ilimitados" className={inputClass} />
                    </Campo>
                    <Campo label="Internet" span="">
                      <input type="text" placeholder="Ej. 10 GB" className={inputClass} />
                    </Campo>
                    <Campo label="SMS" span="">
                      <input type="text" placeholder="Ej. 200" className={inputClass} />
                    </Campo>
                  </div>
                </div>
              </SeccionCard>

              {tipoEntregaTel === 'Renovación' && (
                <SeccionCard
                  icon={Smartphone}
                  titulo="Teléfono que se Devuelve"
                  nota="Solo en renovación"
                >
                  <div className="grid grid-cols-12 gap-x-column-gap gap-y-stack-md p-5">
                    <Campo label="Marca">
                      <input type="text" placeholder="Ej. Motorola" className={inputClass} />
                    </Campo>
                    <Campo label="Modelo">
                      <input type="text" placeholder="Ej. G54" className={inputClass} />
                    </Campo>
                    <Campo label="IMEI">
                      <input type="text" placeholder="15 dígitos" className={`${inputClass} font-mono`} />
                    </Campo>
                  </div>
                </SeccionCard>
              )}
            </>
          )}

          {/* Tabla de equipo */}
          {formato.tieneTabla && esEntrega && (
            <SeccionCard
              icon={Rows3}
              titulo={tituloTabla}
              acciones={
                <div className="flex items-center gap-stack-sm">
                  {filasEntrega.length > 0 && (
                    <span className="rounded-full border border-outline-variant px-2 py-0.5 font-mono text-label-sm tabular-nums text-on-surface-variant">
                      {filasEntrega.length}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={agregarFilaEntrega}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-label-bold text-label-bold text-on-primary transition-opacity hover:opacity-90 active:scale-[0.97] transition-transform"
                  >
                    <PlusCircle className="h-4 w-4" strokeWidth={2} />
                    Agregar fila
                  </button>
                </div>
              }
            >
              {filasEntrega.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                  <formato.icon className="h-6 w-6 text-outline" strokeWidth={1.75} />
                  <div>
                    <p className="font-label-bold text-label-bold text-on-surface">
                      {formato.vacioTitulo}
                    </p>
                    <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                      Agrega el equipo entregado a este colaborador.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={agregarFilaEntrega}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
                  >
                    <PlusCircle className="h-4 w-4" strokeWidth={2} />
                    Agregar equipo
                  </button>
                </div>
              ) : (
                <>
                  {/* Escritorio y tablet: tabla, sin cambios */}
                  <div className="hidden md:block w-full overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-outline-variant bg-surface-container-low">
                          <th className="w-14 py-2.5 pl-5 pr-3 text-right font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
                            No.
                          </th>
                          <th className="py-2.5 pr-3 font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
                            Equipo
                          </th>
                          <th className="py-2.5 pr-3 font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
                            Observaciones
                          </th>
                          <th className="w-12 py-2.5 pr-5" />
                        </tr>
                      </thead>
                      <tbody>
                        {filasEntrega.map((fila, indice) => (
                          <tr
                            key={fila.id}
                            className="border-b border-outline-variant transition-colors hover:bg-surface-container-low"
                          >
                            <td className="py-2 pl-5 pr-3 text-right font-mono text-body-md tabular-nums text-on-surface-variant">
                              {String(indice + 1).padStart(2, '0')}
                            </td>
                            <td className="py-2 pr-3">
                              <SearchableSelect
                                options={equipos.map((e) => ({ id: e.id, name: e.brand ? `${e.name} — ${e.brand}` : e.name }))}
                                value={fila.equipmentId}
                                onChange={(id) => actualizarFilaEntrega(fila.id, 'equipmentId', id)}
                                disabled={cargandoCatalogos}
                                placeholder="Selecciona un equipo"
                                emptyOptionsText="No hay equipos registrados en el catálogo todavía."
                              />
                            </td>
                            <td className="py-2 pr-3">
                              <input
                                type="text"
                                value={fila.observaciones}
                                onChange={(e) => actualizarFilaEntrega(fila.id, 'observaciones', e.target.value)}
                                placeholder="Ej. Se entrega sin cargador"
                                className={celdaInputClass}
                              />
                            </td>
                            <td className="py-2 pr-5">
                              <button
                                type="button"
                                onClick={() => quitarFilaEntrega(fila.id)}
                                aria-label="Quitar equipo"
                                title="Quitar (por si te confundiste de equipo)"
                                className="grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container active:scale-[0.97] transition-transform"
                              >
                                <X className="h-4 w-4" strokeWidth={2} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Móvil: una tarjeta por equipo, con botón de quitar por si se
                      equivocaron de equipo, y "Agregar otro equipo" al final para
                      leer todo de corrido. Sin animate-view-in aquí: el buscador de
                      equipo abre un panel "fixed" en pantalla completa, y un
                      ancestro animado (transform) lo dejaría atrapado dentro de la
                      tarjeta en vez de cubrir toda la pantalla. */}
                  <div className="flex flex-col gap-stack-sm p-4 md:hidden">
                    {filasEntrega.map((fila, indice) => (
                      <div
                        key={fila.id}
                        className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
                      >
                        <div className="mb-stack-sm flex items-center justify-between">
                          <span className="font-label-bold text-label-bold text-on-surface">
                            Equipo #{indice + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => quitarFilaEntrega(fila.id)}
                            aria-label="Quitar equipo"
                            title="Quitar (por si te confundiste de equipo)"
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container active:scale-[0.97] transition-transform"
                          >
                            <X className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-stack-sm">
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-bold text-label-bold text-on-surface">Equipo</label>
                            <SearchableSelect
                              options={equipos.map((e) => ({ id: e.id, name: e.brand ? `${e.name} — ${e.brand}` : e.name }))}
                              value={fila.equipmentId}
                              onChange={(id) => actualizarFilaEntrega(fila.id, 'equipmentId', id)}
                              disabled={cargandoCatalogos}
                              placeholder="Selecciona un equipo"
                              emptyOptionsText="No hay equipos registrados en el catálogo todavía."
                              mobileSheetBreakpoint="md"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-bold text-label-bold text-on-surface">Observaciones</label>
                            <input
                              type="text"
                              value={fila.observaciones}
                              onChange={(e) => actualizarFilaEntrega(fila.id, 'observaciones', e.target.value)}
                              placeholder="Ej. Se entrega sin cargador"
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={agregarFilaEntrega}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-outline px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
                    >
                      <PlusCircle className="h-4 w-4" strokeWidth={2} />
                      Agregar otro equipo
                    </button>
                  </div>
                </>
              )}
            </SeccionCard>
          )}

          {/* Tabla de equipo (resto de formatos: borrador visual, sin conectar a API) */}
          {formato.tieneTabla && !esEntrega && (
            <SeccionCard
              icon={Rows3}
              titulo={tituloTabla}
              acciones={
                <div className="flex items-center gap-stack-sm">
                  {filas.length > 0 && (
                    <>
                      <span className="rounded-full border border-outline-variant px-2 py-0.5 font-mono text-label-sm tabular-nums text-on-surface-variant">
                        {filas.length}
                      </span>
                      <button
                        type="button"
                        onClick={vaciarTabla}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 font-label-bold text-label-bold text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container active:scale-[0.97] transition-transform"
                      >
                        <X className="h-4 w-4" strokeWidth={2} />
                        Vaciar tabla
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={agregarFila}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-label-bold text-label-bold text-on-primary transition-opacity hover:opacity-90 active:scale-[0.97] transition-transform"
                  >
                    <PlusCircle className="h-4 w-4" strokeWidth={2} />
                    Agregar fila
                  </button>
                </div>
              }
            >
              <div className="border-b border-outline-variant p-5">
                <p className="mb-3 font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
                  Verificación Rápida
                </p>
                <div className="flex flex-wrap gap-stack-sm">
                  {formato.accesorios.map((accesorio) => {
                    const activo = accesoriosSeleccionados.includes(accesorio)
                    return (
                      <button
                        key={accesorio}
                        type="button"
                        onClick={() => toggleAccesorio(accesorio)}
                        className={[
                          'inline-flex items-center rounded-full border px-3 py-1.5 font-label-bold text-label-bold transition-colors active:scale-[0.97] transition-transform',
                          activo
                            ? 'border-primary bg-primary text-on-primary'
                            : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-high',
                        ].join(' ')}
                      >
                        {accesorio}
                      </button>
                    )
                  })}
                </div>
              </div>

              {filas.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                  <formato.icon className="h-6 w-6 text-outline" strokeWidth={1.75} />
                  <div>
                    <p className="font-label-bold text-label-bold text-on-surface">
                      {formato.vacioTitulo}
                    </p>
                    <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                      Marca uno arriba para agregarlo con su tipo, o crea una fila en blanco.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={agregarFila}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.97] transition-transform"
                  >
                    <PlusCircle className="h-4 w-4" strokeWidth={2} />
                    Agregar fila en blanco
                  </button>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low">
                        <th className="w-14 py-2.5 pl-5 pr-3 text-right font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
                          No.
                        </th>
                        {['Artículo', 'Marca', 'Modelo', 'No. Serie'].map((col) => (
                          <th
                            key={col}
                            className="py-2.5 pr-3 font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant"
                          >
                            {col}
                          </th>
                        ))}
                        <th className="w-40 py-2.5 pr-3 font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
                          {formato.colFinal}
                        </th>
                        <th className="w-12 py-2.5 pr-5" />
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((fila, indice) => (
                        <tr
                          key={fila.id}
                          className="border-b border-outline-variant transition-colors hover:bg-surface-container-low"
                        >
                          <td className="py-2 pl-5 pr-3 text-right font-mono text-body-md tabular-nums text-on-surface-variant">
                            {String(indice + 1).padStart(2, '0')}
                          </td>
                          {['articulo', 'marca', 'modelo', 'serie'].map((campo) => (
                            <td key={campo} className="py-2 pr-3">
                              <input
                                type="text"
                                value={fila[campo]}
                                onChange={(e) => actualizarFila(fila.id, campo, e.target.value)}
                                placeholder={
                                  campo === 'articulo'
                                    ? 'Especificar...'
                                    : campo === 'marca'
                                      ? 'Ej. Dell'
                                      : campo === 'modelo'
                                        ? 'Ej. P2422H'
                                        : 'CN0F9K2H74'
                                }
                                className={[
                                  celdaInputClass,
                                  campo === 'serie' ? 'font-mono uppercase' : '',
                                ].join(' ')}
                              />
                            </td>
                          ))}
                          <td className="py-2 pr-3">
                            {formato.colFinalTipo === 'select' ? (
                              <select
                                value={fila.detalle}
                                onChange={(e) => actualizarFila(fila.id, 'detalle', e.target.value)}
                                className={celdaInputClass}
                              >
                                <option>Nuevo</option>
                                <option>Usado</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={fila.detalle}
                                onChange={(e) => actualizarFila(fila.id, 'detalle', e.target.value)}
                                placeholder="Motivo del desecho"
                                className={celdaInputClass}
                              />
                            )}
                          </td>
                          <td className="py-2 pr-5">
                            <button
                              type="button"
                              onClick={() => quitarFila(fila.id)}
                              aria-label="Quitar fila"
                              className="grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container active:scale-[0.97] transition-transform"
                            >
                              <X className="h-4 w-4" strokeWidth={2} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SeccionCard>
          )}

          {/* Cláusulas / condiciones */}
          {formato.clausulas.length > 0 && (
            <SeccionCard
              icon={Lock}
              titulo={formato.tituloClausula}
              nota={formato.tieneEncabezadoCondiciones ? 'Texto fijo · complete los espacios' : 'Texto fijo del formato'}
            >
              <div className="space-y-3 p-5">
                {formato.tieneEncabezadoCondiciones && (
                  <p className="border-l-2 border-outline-variant pl-4 font-body-md text-body-md leading-loose text-pretty text-on-surface">
                    Yo
                    <Blanco ancho="w-64" placeholder="nombre completo" />
                    , que me identifico con DPI No.
                    <Blanco ancho="w-44" placeholder="0000 00000 0000" mono />
                    , y que desempeño el puesto de
                    <Blanco placeholder="puesto" />
                    en el departamento de
                    <Blanco placeholder="departamento" />
                    , acepto las condiciones siguientes:
                  </p>
                )}

                {formato.clausulas.map((texto) => (
                  <Parrafo key={texto.slice(0, 40)}>{texto}</Parrafo>
                ))}

                {formato.tieneConstanciaTelefono && (
                  <p className="border-l-2 border-outline-variant pl-4 font-body-md text-body-md leading-loose text-pretty text-on-surface">
                    Recibo el teléfono el día
                    <Blanco ancho="w-14" placeholder="__" />
                    del mes de
                    <Blanco ancho="w-32" placeholder="______" />
                    del año
                    <Blanco ancho="w-20" placeholder="____" />
                    , con número asignado
                    <Blanco ancho="w-36" placeholder="0000-0000" mono />.
                  </p>
                )}
              </div>
            </SeccionCard>
          )}

          {/* Observaciones */}
          <SeccionCard
            icon={MessageSquareText}
            titulo="Observaciones Generales"
            acciones={
              <span className="font-label-sm text-label-sm tabular-nums text-on-surface-variant">
                Opcional · {observaciones.length}/500
              </span>
            }
          >
            <div className="p-5">
              <textarea
                value={observaciones}
                maxLength={500}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder={formato.placeholderObs}
                className="min-h-24 w-full resize-y rounded-lg border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 transition-colors hover:border-outline focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
            </div>
          </SeccionCard>

          {/* Firmas */}
          <SeccionCard icon={PenLine} titulo={formato.tituloFirmas}>
            <div className="p-stack-lg">
              {formato.tieneConstanciaDevolucion && (
                <p className="mb-stack-lg border-l-2 border-outline-variant pl-4 font-body-md text-body-md leading-loose text-pretty text-on-surface">
                  Por este medio se hace constar que el día
                  <Blanco ancho="w-14" placeholder="__" />
                  del mes
                  <Blanco ancho="w-32" placeholder="______" />
                  del año
                  <Blanco ancho="w-20" placeholder="____" />
                  {!dosPaginas && (
                    <>
                      , que me identifico con número de documento personal
                      <Blanco ancho="w-44" placeholder="0000 00000 0000" mono />
                    </>
                  )}
                  , hago constar que entrego todo el equipo descrito arriba. Yo
                  <Blanco ancho="w-72" placeholder="(clic para escribir su nombre)" />
                </p>
              )}

              <div className="grid grid-cols-1 gap-stack-lg sm:grid-cols-2">
                {formato.firmas.map((firma) => (
                  <FirmaPad
                    key={firma.key}
                    titulo={firma.titulo}
                    subtitulo={firma.subtitulo}
                    firmaUrl={firmas[firma.key] ?? null}
                    onConfirmar={(dataUrl) =>
                      setFirmas((prev) => ({ ...prev, [firma.key]: dataUrl }))
                    }
                    onReiniciar={() =>
                      setFirmas((prev) => {
                        const copia = { ...prev }
                        delete copia[firma.key]
                        return copia
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </SeccionCard>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="sticky bottom-0 z-30 border-t border-outline-variant bg-surface-container-lowest px-container-padding py-3 shadow-sm md:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          {esEntrega && errorGuardar ? (
            <p className="font-label-sm text-label-sm text-error rounded-lg border border-error/30 bg-error-container/40 px-3 py-2">
              {errorGuardar}
            </p>
          ) : (
            <span className="font-label-bold text-label-bold text-on-surface-variant">
              {esEntrega ? 'Complete los datos para guardar' : 'Borrador · sin guardar'}
            </span>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={esEntrega && guardando}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-6 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60 active:scale-[0.97] transition-transform"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={esEntrega ? handleClicFinalizarEntrega : undefined}
              disabled={esEntrega && (guardando || cargandoCatalogos)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-label-bold text-label-bold text-on-primary shadow-sm transition-opacity hover:opacity-90 active:scale-[0.97] transition-transform disabled:cursor-not-allowed disabled:opacity-60"
            >
              {esEntrega && guardando && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              {formato.textoAccion}
            </button>
          </div>
        </div>
      </div>

      {esEntrega && (
        <ConfirmDialog
          abierto={confirmandoFinalizar}
          titulo="Finalizar entrega"
          mensaje="¿Confirmas que los datos y las firmas son correctos? Se guardará como una entrega registrada."
          textoConfirmar="Sí, finalizar"
          permitirNoPreguntar
          onCancelar={() => setConfirmandoFinalizar(false)}
          onConfirmar={handleConfirmarFinalizarEntrega}
        />
      )}
    </div>
  )
}

export { SeccionCard, Campo }

export default FormatoActa
