import { useCallback, useEffect, useRef, useState } from 'react'
import { descargarCsv, nombreArchivoCsv } from '../utils/csv.js'
import { mostrarToast } from '../components/Toast.jsx'

// El archivo se arma en memoria en milisegundos, pero el usuario pidió ver
// la misma señal de "trabajando" que el resto de escrituras (pastilla con el
// isotipo + aviso negro al terminar). Sin esta pausa la pastilla, que entra a
// los 150ms, nunca se vería. Es solo presentación y no retrasa nada del
// backend: los datos ya están cargados.
const PAUSA_VISIBLE_MS = 650

/**
 * Exportación a CSV con la señal de carga del sistema.
 *   const { exportando, exportar } = useExportacionCsv()
 *   exportar({ nombre: 'entregas-IT', columnas, filas })
 * Mientras `exportando` es true la pantalla muestra <IndicadorGuardando
 * texto="Generando CSV" /> y el isotipo en el botón.
 */
export default function useExportacionCsv() {
  const [exportando, setExportando] = useState(false)
  const vivo = useRef(true)
  useEffect(() => () => {
    vivo.current = false
  }, [])

  const exportar = useCallback(async ({ nombre, columnas, filas }) => {
    if (!filas || filas.length === 0) {
      mostrarToast('No hay registros para exportar', { tipo: 'error' })
      return
    }
    setExportando(true)
    try {
      await new Promise((resolver) => setTimeout(resolver, PAUSA_VISIBLE_MS))
      if (!vivo.current) return
      descargarCsv(nombreArchivoCsv(nombre), columnas, filas)
      mostrarToast(filas.length === 1 ? 'CSV descargado · 1 registro' : `CSV descargado · ${filas.length} registros`)
    } catch {
      mostrarToast('No se pudo generar el CSV', { tipo: 'error' })
    } finally {
      if (vivo.current) setExportando(false)
    }
  }, [])

  return { exportando, exportar }
}
