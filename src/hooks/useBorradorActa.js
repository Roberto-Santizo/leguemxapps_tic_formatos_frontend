import { useEffect, useRef, useState } from 'react'

// Borrador automático de un acta a medio llenar (entrega o devolución).
//
// Por qué: la sesión (JWT) dura 60 min y no se renueva. Si vencía al pulsar
// "Finalizar", el sistema mandaba al login y se perdía el acta completa --
// equipos, observaciones y las firmas del colaborador. Lo mismo al cerrar la
// pestaña o recargar por error. Ahora lo que se va llenando se guarda solo en
// este navegador (localStorage) y, al volver a la misma hoja, se recupera.
//
// - La clave lleva el usuario: otra cuenta en el mismo navegador no hereda el
//   borrador de nadie.
// - Se guarda medio segundo después del último cambio y al salir de la hoja.
// - Se borra al registrar el acta, al pulsar "Cancelar" o con "Descartar".
// - Si el navegador no tiene espacio para las firmas (imágenes), se guarda al
//   menos lo demás; sin almacenamiento, la hoja funciona igual que antes.
//
//   const inicial = leerBorrador(clave)            // en los useState(() => ...)
//   const borrador = useBorradorActa(clave, datos, { activo, conContenido })
//   borrador.limpiar()                              // al registrar / cancelar

const PREFIJO = 'legumex_borrador:'
const ESPERA_MS = 500

export function claveBorrador(usuario, ...partes) {
  if (!usuario) return null
  return `${PREFIJO}${usuario}:${partes.join(':')}`
}

/** { datos, guardadoEn } o null. */
export function leerBorrador(clave) {
  if (!clave) return null
  try {
    const guardado = JSON.parse(localStorage.getItem(clave) || 'null')
    if (!guardado || typeof guardado !== 'object' || !guardado.datos) return null
    return { datos: guardado.datos, guardadoEn: Number(guardado.guardadoEn) || null }
  } catch {
    return null
  }
}

function escribir(clave, datos) {
  const guardadoEn = Date.now()
  try {
    localStorage.setItem(clave, JSON.stringify({ guardadoEn, datos }))
    return
  } catch {
    // Sin espacio: probablemente por las firmas. Se reintenta sin ellas.
  }
  try {
    localStorage.setItem(clave, JSON.stringify({ guardadoEn, datos: { ...datos, firmas: {} } }))
  } catch {
    // almacenamiento no disponible: sin borrador
  }
}

function borrar(clave) {
  try {
    localStorage.removeItem(clave)
  } catch {
    // nada que borrar
  }
}

/**
 * Guarda `datos` en `clave` mientras `activo` (p. ej. no mientras carga la
 * hoja ni después de registrarla). Si no hay nada escrito (`conContenido`
 * falso) quita el borrador, para no ofrecer una hoja en blanco.
 */
export default function useBorradorActa(clave, datos, { activo = true, conContenido = true } = {}) {
  const serializado = JSON.stringify(datos)
  const pendiente = useRef(null)
  const [inactivo, setInactivo] = useState(false)

  useEffect(() => {
    if (!clave || !activo || inactivo) return undefined
    const guardar = () => {
      pendiente.current = null
      if (conContenido) escribir(clave, JSON.parse(serializado))
      else borrar(clave)
    }
    pendiente.current = guardar
    const t = setTimeout(guardar, ESPERA_MS)
    return () => clearTimeout(t)
  }, [clave, serializado, activo, conContenido, inactivo])

  // Al salir de la hoja (incluida la sesión vencida, que desmonta la página
  // para ir al login) se guarda en el acto lo que estaba esperando.
  useEffect(
    () => () => {
      if (pendiente.current) pendiente.current()
    },
    [],
  )

  return {
    /** Borra el borrador y deja de guardar (acta registrada o cancelada). */
    limpiar() {
      pendiente.current = null
      setInactivo(true)
      if (clave) borrar(clave)
    },
    /** Borra el borrador pero sigue guardando lo que se escriba después. */
    descartar() {
      pendiente.current = null
      if (clave) borrar(clave)
    },
  }
}
