import useLocalStorageState from './useLocalStorageState.js'

// Corrección LOCAL (solo en este navegador) de delivery_date/return_date --
// el backend asigna esa fecha al crear el documento y su PUT no acepta
// corregirla después (confirmado contra el swagger: DeliveryDocumentUpdateRequest
// solo admite location/observations, y el PUT de return_documents solo
// observations). Esto NO llama a la API ni cambia el registro real: guarda
// el ajuste en localStorage de este navegador para que la pantalla y el PDF
// descargado muestren la fecha correcta del acta física. Si alguien abre el
// mismo documento desde otra computadora, seguirá viendo la fecha original
// del servidor -- el ajuste no se comparte.
function useFechaLocal(tipo, id, valorOriginal) {
  const key = `legumex_fecha_local_${tipo}_${id}`
  const [guardado, setGuardado] = useLocalStorageState(key, null)

  return {
    valor: guardado || valorOriginal,
    corregida: Boolean(guardado),
    // ymd = "aaaa-mm-dd" del <input type="date">. Se guarda al mediodía UTC
    // para que, al convertir a hora de Guatemala (UTC-6) en formatearFecha,
    // nunca "ruede" un día hacia atrás.
    corregir: (ymd) => setGuardado(`${ymd}T12:00:00.000Z`),
    restablecer: () => setGuardado(null),
  }
}

export default useFechaLocal
