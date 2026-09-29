import { useState } from 'react'
import { Moon, Sun, SunMoon } from 'lucide-react'
import { aplicarTema, leerTema, siguienteTema } from '../utils/tema.js'

// Botón de tema de la tarjeta de perfil (componente autorizado): cada toque pasa
// Automático → Claro → Oscuro. "Automático" sigue al tema del equipo.
const ICONO = { auto: SunMoon, claro: Sun, oscuro: Moon }
const NOMBRE = { auto: 'Automático', claro: 'Claro', oscuro: 'Oscuro' }

function BotonTema() {
  const [tema, setTema] = useState(leerTema)
  const Icono = ICONO[tema]
  const siguiente = siguienteTema(tema)

  return (
    <button
      type="button"
      data-recorrido="tema"
      onClick={() => {
        aplicarTema(siguiente)
        setTema(siguiente)
      }}
      title={`Tema: ${NOMBRE[tema]}. Cambiar a ${NOMBRE[siguiente].toLowerCase()}`}
      aria-label={`Tema: ${NOMBRE[tema]}. Cambiar a ${NOMBRE[siguiente].toLowerCase()}`}
      className="btn-icono h-9 w-9 shrink-0"
    >
      <Icono className="h-4.5 w-4.5" strokeWidth={1.75} />
    </button>
  )
}

export default BotonTema
