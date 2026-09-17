import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// Tamaño de página de todas las listas (paginacion.md §5: mantener `limit`
// constante mientras se navega; cambiarlo invalida `lastPage`).
export const TAMANO_PAGINA = 20

function leerPagina(valor) {
  const n = Number.parseInt(valor, 10)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

/**
 * Estado de paginación y búsqueda en la URL (`?page=2&q=dell`), para que
 * refrescar, el botón atrás y un enlace directo conserven dónde estaba el
 * usuario. No hay estado local duplicado: la URL es la única fuente.
 *
 *  - `pagina` inválida o ausente → 1. En la URL, page=1 se omite.
 *  - `irAPagina(n)` agrega entrada al historial (atrás vuelve a la anterior);
 *    con { replace: true } la sustituye (corrección de página fuera de rango).
 *  - `setBusqueda` reemplaza (cada tecla no debe ensuciar el historial) y
 *    vuelve a la página 1, porque el conjunto de resultados cambió.
 */
export function usePaginaUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pagina = leerPagina(searchParams.get('page'))
  const busqueda = searchParams.get('q') || ''

  const irAPagina = useCallback(
    (n, { replace = false } = {}) => {
      setSearchParams(
        (prev) => {
          const sig = new URLSearchParams(prev)
          if (n > 1) sig.set('page', String(n))
          else sig.delete('page')
          return sig
        },
        { replace },
      )
    },
    [setSearchParams],
  )

  const setBusqueda = useCallback(
    (texto) => {
      setSearchParams(
        (prev) => {
          const sig = new URLSearchParams(prev)
          if (texto) sig.set('q', texto)
          else sig.delete('q')
          sig.delete('page')
          return sig
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { pagina, busqueda, irAPagina, setBusqueda }
}

/**
 * Carga de una lista paginada con búsqueda híbrida (el backend pagina pero
 * no tiene filtro de texto en estos listados -- ver paginacion.md §4):
 *
 *  - Sin texto de búsqueda: se pide al servidor solo la página actual
 *    (`limit` + `page`) y se usan `total` / `lastPage` de la respuesta.
 *  - Con texto: se pide UNA vez el listado completo (sin `limit`), se
 *    filtra en el cliente con `filtrar(registro, filtroEnMinusculas)` y se
 *    pagina también en el cliente con el mismo tamaño. El listado completo
 *    se conserva mientras el usuario siga escribiendo; se descarta al
 *    limpiar la búsqueda o al `recargar`.
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
export function useListaPaginada({ token, listar, filtrar, mensajeError }) {
  const { pagina, busqueda, irAPagina, setBusqueda } = usePaginaUrl()
  const filtro = busqueda.trim().toLowerCase()
  const modo = filtro ? 'todos' : 'pagina'

  // Resultado de la última página pedida al servidor. `pagina` guarda cuál se
  // pidió, para no corregir la URL con datos de una petición anterior.
  const [respuesta, setRespuesta] = useState(null) // { pagina, data, total, lastPage }
  const [todos, setTodos] = useState(null) // listado completo (modo búsqueda) o null
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Se incrementa en `recargar` para forzar el efecto aunque nada más cambie.
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (modo === 'todos' && todos !== null) return undefined
    let vivo = true
    setCargando(true)
    setError('')
    ;(async () => {
      try {
        if (modo === 'pagina') {
          const r = await listar(token, { limit: TAMANO_PAGINA, page: pagina })
          if (!vivo) return
          setRespuesta({
            pagina,
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
  }, [token, listar, modo, pagina, todos, version])

  const filtrados = useMemo(() => {
    if (modo !== 'todos' || !todos) return []
    return todos.filter((r) => filtrar(r, filtro))
  }, [modo, todos, filtro, filtrar])

  let registros = []
  let total = 0
  let ultimaPagina = 1
  if (modo === 'todos') {
    total = filtrados.length
    ultimaPagina = Math.max(1, Math.ceil(total / TAMANO_PAGINA))
    registros = filtrados.slice((pagina - 1) * TAMANO_PAGINA, pagina * TAMANO_PAGINA)
  } else if (respuesta && respuesta.pagina === pagina) {
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
    (modo === 'todos' ? todos !== null : Boolean(respuesta && respuesta.pagina === pagina))
  useEffect(() => {
    if (fueraDeRango) irAPagina(ultimaPagina, { replace: true })
  }, [fueraDeRango, ultimaPagina, irAPagina])

  const recargar = useCallback(() => {
    setTodos(null)
    setVersion((v) => v + 1)
  }, [])

  const limpiarBusqueda = useCallback(() => {
    setTodos(null)
    setBusqueda('')
  }, [setBusqueda])

  return {
    registros,
    total,
    pagina,
    ultimaPagina,
    busqueda,
    setBusqueda,
    limpiarBusqueda,
    irAPagina,
    // Mientras se corrige una página fuera de rango se sigue mostrando el
    // esqueleto, para que no parpadee un "no hay registros" falso.
    cargando: cargando || fueraDeRango,
    error,
    recargar,
  }
}
