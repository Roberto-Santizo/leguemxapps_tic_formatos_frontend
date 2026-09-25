import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { guardarVistaLista, leerVistaLista } from '../utils/memoriaListas.js'

// Tamaño de página por defecto de todas las listas (paginacion.md §5:
// mantener `limit` constante mientras se navega; cambiarlo invalida
// `lastPage`). Es el valor que se escribe en la URL cuando no trae `limit`.
export const TAMANO_PAGINA = 20

function leerEntero(valor, porDefecto) {
  const n = Number.parseInt(valor, 10)
  return Number.isInteger(n) && n >= 1 ? n : porDefecto
}

/**
 * Estado de paginación y búsqueda en la URL (`?page=2&limit=20&q=dell`),
 * para que refrescar, el botón atrás y un enlace directo conserven dónde
 * estaba el usuario. No hay estado local duplicado: la URL es la única
 * fuente.
 *
 *  - La URL SIEMPRE lleva `page` y `limit` explícitos (son los mismos que
 *    se mandan al backend). Al entrar a la vista sin ellos, o con valores
 *    inválidos, se completan de inmediato reemplazando la entrada del
 *    historial: `/catalogo/marcas` → `/catalogo/marcas?page=1&limit=20`.
 *  - `pagina` inválida o ausente → 1; `limite` inválido o ausente →
 *    TAMANO_PAGINA.
 *  - `irAPagina(n)` agrega entrada al historial (atrás vuelve a la anterior);
 *    con { replace: true } la sustituye (corrección de página fuera de rango).
 *  - `setBusqueda` reemplaza (cada tecla no debe ensuciar el historial) y
 *    vuelve a la página 1, porque el conjunto de resultados cambió.
 *  - `setParametro(nombre, valor)` es lo mismo para los filtros propios de
 *    cada lista (p. ej. `estado` en Equipos): se guarda en la URL junto a los
 *    demás y vuelve a la página 1 por la misma razón. Valor vacío lo borra,
 *    para no dejar `?estado=` colgando.
 *  - La vista (búsqueda, filtros y página) se recuerda por ruta
 *    (utils/memoriaListas.js): si la lista se abre SIN parámetros -- el botón
 *    "volver" de ver/editar, el menú, la redirección tras guardar -- se
 *    restaura la última. Mientras tanto `restaurando` es true y la lista no
 *    pide nada, para no cargar ni mostrar un instante la lista sin filtrar.
 *    Pulsar el menú de la misma lista ya abierta no la vuelve a montar: sigue
 *    limpiando la búsqueda como antes.
 */
export function usePaginaUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { pathname, search } = useLocation()
  // Solo se decide al montar: una URL sin parámetros más adelante (el enlace
  // del menú a esta misma lista) es una orden de limpiar, no de restaurar.
  const [pendiente, setPendiente] = useState(() => (search ? '' : leerVistaLista(pathname)))
  const pagina = leerEntero(searchParams.get('page'), 1)
  const limite = leerEntero(searchParams.get('limit'), TAMANO_PAGINA)
  const busqueda = searchParams.get('q') || ''

  // Escribe page/limit en la URL conservando el resto (`q` y los filtros
  // propios de cada lista). Se usa tanto para navegar como para completar la
  // URL inicial.
  const escribir = useCallback(
    (n, { replace = false, texto, extras } = {}) => {
      setSearchParams(
        (prev) => {
          const sig = new URLSearchParams(prev)
          sig.set('page', String(n))
          sig.set('limit', String(leerEntero(prev.get('limit'), TAMANO_PAGINA)))
          if (texto !== undefined) {
            if (texto) sig.set('q', texto)
            else sig.delete('q')
          }
          for (const [clave, valor] of Object.entries(extras || {})) {
            if (valor) sig.set(clave, valor)
            else sig.delete(clave)
          }
          return sig
        },
        { replace },
      )
    },
    [setSearchParams],
  )

  // URL inicial (o editada a mano) sin page/limit válidos → se completa.
  const urlCompleta =
    searchParams.get('page') === String(pagina) && searchParams.get('limit') === String(limite)
  useEffect(() => {
    if (pendiente) {
      if (search) setPendiente('')
      else setSearchParams(new URLSearchParams(pendiente), { replace: true })
      return
    }
    if (!urlCompleta) escribir(pagina, { replace: true })
  }, [pendiente, search, setSearchParams, urlCompleta, pagina, escribir])

  // Cada cambio de búsqueda, filtro o página queda recordado para esta ruta.
  useEffect(() => {
    if (!pendiente && urlCompleta) guardarVistaLista(pathname, searchParams.toString())
  }, [pendiente, urlCompleta, pathname, searchParams])

  const irAPagina = useCallback((n, opciones) => escribir(n, opciones), [escribir])

  const setBusqueda = useCallback((texto) => escribir(1, { replace: true, texto }), [escribir])

  const parametro = useCallback((nombre) => searchParams.get(nombre) || '', [searchParams])

  const setParametro = useCallback(
    (nombre, valor) => escribir(1, { replace: true, extras: { [nombre]: valor } }),
    [escribir],
  )

  // Varios filtros a la vez en UNA sola escritura de la URL (p. ej. "Limpiar
  // filtros"). Llamar setParametro varias veces seguidas no sirve: cada
  // llamada parte de la URL actual y la última pisa a las anteriores.
  const setParametros = useCallback(
    (valores) => escribir(1, { replace: true, extras: valores }),
    [escribir],
  )

  return {
    pagina,
    limite,
    busqueda,
    irAPagina,
    setBusqueda,
    parametro,
    setParametro,
    setParametros,
    restaurando: Boolean(pendiente),
  }
}

/**
 * Carga de una lista paginada con búsqueda híbrida (el backend pagina pero
 * no tiene filtro de texto en estos listados -- ver paginacion.md §4):
 *
 *  - Sin texto de búsqueda: se pide al servidor solo la página actual
 *    (`limit` + `page`, los mismos de la URL) y se usan `total` /
 *    `lastPage` de la respuesta.
 *  - Con texto: se pide UNA vez el listado completo (sin `limit`), se
 *    filtra en el cliente con `filtrar(registro, filtroEnMinusculas)` y se
 *    pagina también en el cliente con el mismo `limit`. El listado completo
 *    se conserva mientras el usuario siga escribiendo; se descarta al
 *    limpiar la búsqueda o al `recargar`.
 *
 * `filtroExtra` es un filtro adicional opcional de la vista -- una función
 * `(registro) => boolean`, o null cuando no hay ninguno activo. Cuando viene,
 * obliga al mismo modo "todos" que la búsqueda, y por el mismo motivo: un
 * filtro que solo mirara la página actual mostraría 4 de 20 filas mientras el
 * paginador sigue diciendo 57, y las demás coincidencias quedarían escondidas
 * en páginas que el usuario no tiene forma de saber que debe abrir. Hoy lo usa
 * el filtro por estado de la lista de Equipos.
 *
 * Si la página pedida queda fuera de rango (p. ej. se borró el último
 * registro de la última página, o alguien editó la URL), se sustituye en la
 * URL por la última página válida -- el backend responde 200 con data: []
 * en ese caso, no es error.
 *
 * `listar(token, { limit, page })` es una de las funciones listar* de
 * api.js: con paginación regresa { data, total, lastPage }; sin ella, el
 * arreglo completo.
 */
export function useListaPaginada({ token, listar, filtrar, mensajeError, filtroExtra = null }) {
  const { pagina, limite, busqueda: busquedaUrl, irAPagina, setBusqueda, restaurando } = usePaginaUrl()
  const filtro = busquedaUrl.trim().toLowerCase()
  const modo = filtro || filtroExtra ? 'todos' : 'pagina'

  // Texto del buscador. El <input> NO puede ir controlado directamente por
  // `q` de la URL: React Router aplica cada navegación como transición de
  // baja prioridad y el valor llega tarde, así que al escribir rápido se
  // pierden letras. Por eso el texto vive aquí (inmediato) y la URL lo sigue;
  // la URL sigue siendo la fuente para filtrar y cargar datos. `escritos`
  // recuerda lo que este hook mandó a la URL, para distinguir el eco de sus
  // propias escrituras (se ignora) de un cambio externo, p. ej. el enlace
  // del menú a la misma lista sin `q` (se adopta).
  const [busqueda, setTexto] = useState(busquedaUrl)
  const escritos = useRef(new Set())
  useEffect(() => {
    if (escritos.current.has(busquedaUrl)) {
      if (busquedaUrl === busqueda) escritos.current.clear()
      return
    }
    setTexto(busquedaUrl)
  }, [busquedaUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const cambiarBusqueda = useCallback(
    (texto) => {
      escritos.current.add(texto)
      setTexto(texto)
      setBusqueda(texto)
    },
    [setBusqueda],
  )

  // Resultado de la última página pedida al servidor. `pagina` / `limite`
  // guardan qué se pidió, para no mostrar ni corregir la URL con datos de
  // una petición anterior.
  const [respuesta, setRespuesta] = useState(null) // { pagina, limite, data, total, lastPage }
  const [todos, setTodos] = useState(null) // listado completo (modo búsqueda) o null
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Se incrementa en `recargar` para forzar el efecto aunque nada más cambie.
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (restaurando) return undefined
    if (modo === 'todos' && todos !== null) return undefined
    let vivo = true
    setCargando(true)
    setError('')
    ;(async () => {
      try {
        if (modo === 'pagina') {
          const r = await listar(token, { limit: limite, page: pagina })
          if (!vivo) return
          setRespuesta({
            pagina,
            limite,
            data: Array.isArray(r?.data) ? r.data : [],
            total: Number(r?.total) || 0,
            lastPage: Math.max(1, Number(r?.lastPage) || 1),
          })
        } else {
          const r = await listar(token)
          if (!vivo) return
          setTodos(Array.isArray(r) ? r : [])
        }
      } catch (err) {
        if (vivo) setError(err.message || mensajeError || 'No se pudo obtener la lista')
      } finally {
        if (vivo) setCargando(false)
      }
    })()
    return () => {
      vivo = false
    }
    // `todos` entra en las dependencias solo para que, al llenarse, el efecto
    // vuelva a correr y salga por el `return` de arriba (sin repetir la carga).
  }, [token, listar, modo, pagina, limite, todos, version, restaurando])

  // Los dos filtros se acumulan: buscar "dell" con el chip "Disponible" puesto
  // deja solo los Dell que además están libres.
  const filtrados = useMemo(() => {
    if (modo !== 'todos' || !todos) return []
    return todos.filter((r) => (!filtro || filtrar(r, filtro)) && (!filtroExtra || filtroExtra(r)))
  }, [modo, todos, filtro, filtrar, filtroExtra])

  let registros = []
  let total = 0
  let ultimaPagina = 1
  if (modo === 'todos') {
    total = filtrados.length
    ultimaPagina = Math.max(1, Math.ceil(total / limite))
    registros = filtrados.slice((pagina - 1) * limite, pagina * limite)
  } else if (respuesta && respuesta.pagina === pagina && respuesta.limite === limite) {
    registros = respuesta.data
    total = respuesta.total
    ultimaPagina = respuesta.lastPage
  }

  // Página fuera de rango → última página válida (reemplazando la entrada
  // del historial, para que "atrás" no vuelva a caer en la inválida).
  const fueraDeRango =
    !cargando &&
    !error &&
    pagina > ultimaPagina &&
    (modo === 'todos' ? todos !== null : Boolean(respuesta && respuesta.pagina === pagina && respuesta.limite === limite))
  useEffect(() => {
    if (fueraDeRango) irAPagina(ultimaPagina, { replace: true })
  }, [fueraDeRango, ultimaPagina, irAPagina])

  const recargar = useCallback(() => {
    setTodos(null)
    setVersion((v) => v + 1)
  }, [])

  const limpiarBusqueda = useCallback(() => {
    setTodos(null)
    cambiarBusqueda('')
  }, [cambiarBusqueda])

  return {
    registros,
    // Todos los registros que cumplen la búsqueda y el filtro (no solo la
    // página): lo usa la exportación a CSV "de todo". En modo página (sin
    // búsqueda ni filtro) es la página actual, porque es lo único cargado.
    todosFiltrados: modo === 'todos' ? filtrados : registros,
    total,
    pagina,
    limite,
    ultimaPagina,
    busqueda,
    setBusqueda: cambiarBusqueda,
    limpiarBusqueda,
    irAPagina,
    // Mientras se corrige una página fuera de rango se sigue mostrando el
    // esqueleto, para que no parpadee un "no hay registros" falso.
    cargando: cargando || fueraDeRango || restaurando,
    error,
    recargar,
  }
}
