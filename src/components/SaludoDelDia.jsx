import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { saludoHora } from '../config/cielo.js'

// Saludo "Buenos días, Gerardo." (mockup Sierra) arriba del título de la
// pantalla a la que llega cada rol al entrar: Nueva Acta (admin) e Historial
// (user). Sale solo la PRIMERA vez del día en ese navegador y para ese
// usuario: la fecha queda en localStorage por usuario. Es solo presentación;
// si el almacenamiento no está disponible, el saludo se muestra siempre.
const CLAVE = 'legumex_saludo_dia'

function hoyLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function SaludoDelDia() {
  const { user } = useAuth()
  const clave = `${CLAVE}:${user?.username || ''}`
  // Solo lectura al montar (puro); la fecha se escribe en el efecto.
  const [mostrar] = useState(() => {
    try {
      return localStorage.getItem(clave) !== hoyLocal()
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (!mostrar) return
    try {
      localStorage.setItem(clave, hoyLocal())
    } catch {
      // Sin almacenamiento: se volverá a saludar en la próxima visita.
    }
  }, [mostrar, clave])

  if (!mostrar) return null
  const nombre = (user?.name || '').trim().split(/\s+/)[0]

  return (
    <p className="mb-5 animate-view-in font-body-lg text-body-lg font-semibold text-on-surface">
      {saludoHora()}
      {nombre ? `, ${nombre}` : ''}.
    </p>
  )
}

export default SaludoDelDia
