import { useCallback, useEffect, useRef, useState } from 'react'
import { descargarCsv, nombreArchivoCsv } from '../utils/csv.js'
import { mostrarToast } from '../components/Toast.jsx'

// El archivo se arma en memoria en milisegundos, pero el usuario pidió ver
// la misma señal de "trabajando" que el resto de escrituras (pastilla con el
// isotipo + aviso negro al terminar). Sin esta pausa la pastilla, que entra a
// los 150ms, nunca se vería. Es solo presentación: si además hay que pedir
// datos (filas como función), esa carga corre en paralelo con esta pausa.
const PAUSA_VISIBLE_MS = 650

/**
 * Exportación a CSV con la señal de carga del sistema.
 *   const { exportando, exportar } = useExportacionCsv()
 *   exportar({ nombre: 'entregas-IT', columnas, filas })
 * `filas` puede ser un arreglo o una función async que lo arma (p. ej. pedir
 * al servidor la ficha completa de cada equipo de la página): esa carga corre
 * en paralelo con la pausa mínima, así que no suma espera.
 * Mientras `exportando` es true la pantalla muestra <IndicadorGuardando
 * texto="Generando CSV" /> y el isotipo en el botón.
 */
export default function useExportacionCsv() {
  const [exportando, setExportando] = useState(false)
  // Se marca como montado en el propio efecto (no solo en el useRef inicial):
  // en desarrollo StrictMode monta, desmonta y vuelve a montar, y sin esto la
  // bandera quedaba en false para siempre y el CSV nunca se descargaba.
  const vivo = useRef(true)
  useEffect(() => {
    vivo.current = true
    return () => {
      vivo.current = false
    }
  }, [])

  const exportar = useCallback(async ({ nombre, columnas, filas }) => {
    if (Array.isArray(filas) && filas.length === 0) {
      mostrarToast('No hay registros para exportar', { tipo: 'error' })
      return
    }
    setExportando(true)
    try {
      const [datos] = await Promise.all([
        typeof filas === 'function' ? filas() : filas,
        new Promise((resolver) => setTimeout(resolver, PAUSA_VISIBLE_MS)),
      ])
      if (!vivo.current) return
      if (!Array.isArray(datos) || datos.length === 0) {
        mostrarToast('No hay registros para exportar', { tipo: 'error' })
        return
      }
      descargarCsv(nombreArchivoCsv(nombre), columnas, datos)
      mostrarToast(datos.length === 1 ? 'CSV descargado · 1 registro' : `CSV descargado · ${datos.length} registros`)
    } catch {
      mostrarToast('No se pudo generar el CSV', { tipo: 'error' })
    } finally {
      if (vivo.current) setExportando(false)
    }
  }, [])

  return { exportando, exportar }
}
