import { AlertTriangle, SearchX, Inbox } from 'lucide-react'

/**
 * Estado vacío / de error / sin resultados, con la misma insignia circular que
 * ya usa EnConstruccion (h-14, bg-secondary-container) para que las pantallas
 * "sin contenido" del sistema se vean todas de la misma familia.
 *
 * El envoltorio reproduce exactamente el bloque que hoy tienen las listas
 * (flex-col centrado, px-5 py-14, text-center), así que se puede sustituir el
 * JSX actual sin que cambie ni el alto de la caja ni el espaciado alrededor.
 *
 * Tres variantes, porque hoy "no hay nada", "falló la carga" y "la búsqueda no
 * encontró" se ven idénticas y solo cambian las palabras:
 *   - vacio     → insignia neutra + el ícono del dominio (el de la tarjeta de
 *                 Catálogo desde la que se entró, para dar continuidad)
 *   - error     → insignia en error-container + AlertTriangle
 *   - busqueda  → insignia neutra + SearchX
 *
 * `accion` recibe el botón ya construido por la pantalla que lo usa, para no
 * imponerle aquí ni la ruta ni el texto.
 */
function EstadoVacio({ icon: Icon, variante = 'vacio', titulo, descripcion, accion }) {
  const esError = variante === 'error'

  const IconoFinal = Icon ?? (esError ? AlertTriangle : variante === 'busqueda' ? SearchX : Inbox)

  const insignia = esError
    ? 'bg-error-container text-on-error-container'
    : 'bg-secondary-container text-on-secondary-container'

  return (
    <div className="flex flex-col items-center gap-4 px-5 py-14 text-center">
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${insignia}`}>
        <IconoFinal className="h-6 w-6" strokeWidth={2} />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="font-label-bold text-label-bold text-on-surface">{titulo}</p>
        {descripcion && (
          <p className="max-w-sm font-body-md text-body-md text-on-surface-variant break-words">
            {descripcion}
          </p>
        )}
      </div>

      {accion}
    </div>
  )
}

export default EstadoVacio
