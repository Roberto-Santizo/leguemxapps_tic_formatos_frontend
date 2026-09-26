import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { login as loginRequest, EVENTO_SESION_EXPIRADA } from '../services/api.js'
import { olvidarVistasListas } from '../utils/memoriaListas.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'legumex_session'

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Vencimiento del token (ms) leído de su `exp`, para avisar antes de que
// caduque (components/AvisoSesion.jsx). Solo se lee: no se valida ni se
// renueva (no hay endpoint de renovación confirmado). null si el token no es
// un JWT legible o no trae `exp` -- entonces simplemente no hay aviso.
function venceDelToken(token) {
  try {
    const parte = String(token).split('.')[1]
    if (!parte) return null
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/')
    const datos = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
    return Number.isFinite(datos?.exp) ? datos.exp * 1000 : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)
  // La sesión se cerró porque venció (no a mano): el login lo explica y
  // recuerda que el acta a medio llenar quedó como borrador.
  const [sesionVencida, setSesionVencida] = useState(false)
  const venceEn = useMemo(() => (session?.token ? venceDelToken(session.token) : null), [session])

  // Banderas de "no volver a preguntar en esta sesión" para confirmaciones
  // puntuales (hoy: Finalizar Entrega / Finalizar Devolución). A propósito
  // NO se guardan en localStorage -- viven solo en memoria, así que una
  // recarga de página o un logout las borra y la próxima vez vuelve a
  // preguntar, tal como se pidió ("se acabó la sesión, te vuelve a
  // preguntar"). Es un objeto { claveDeAccion: true } para que cada acción
  // tenga su propio "no preguntar" independiente.
  const [omitirConfirmacion, setOmitirConfirmacion] = useState({})

  useEffect(() => {
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // almacenamiento no disponible, se ignora silenciosamente
    }
  }, [session])

  // El backend contestó 401 con un token que ya teníamos: el JWT venció (dura
  // 60 min por defecto). Se cierra la sesión aquí mismo para que RequireAuth
  // mande a /login; antes de esto la sesión quedaba viva en localStorage, cada
  // pantalla mostraba "Unauthenticated." como error de carga, "Reintentar"
  // fallaba siempre y la única salida era cerrar sesión a mano.
  useEffect(() => {
    function alExpirar() {
      setSession(null)
      setOmitirConfirmacion({})
      setSesionVencida(true)
    }
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
  }, [])

  async function login(username, password) {
    const result = await loginRequest(username, password)
    setSesionVencida(false)
    // result = { token, user: { username, name, role } }
    // (el backend Laravel no regresa id -- usa "username" como identificador
    // del lado del cliente si se necesita)
    setSession(result)
    return result.user
  }

  // Cerrar sesión a mano olvida también las búsquedas y filtros recordados de
  // las listas (otra cuenta en este navegador no los hereda). Al vencer el
  // token no: quien vuelve a entrar suele ser la misma persona.
  function logout() {
    setSesionVencida(false)
    setSession(null)
    setOmitirConfirmacion({})
    olvidarVistasListas()
  }

  function marcarOmitirConfirmacion(clave) {
    setOmitirConfirmacion((prev) => ({ ...prev, [clave]: true }))
  }

  const value = {
    user: session?.user || null,
    token: session?.token || null,
    login,
    logout,
    isAuthenticated: Boolean(session?.token),
    isAdmin: session?.user?.role === 'admin',
    venceEn,
    sesionVencida,
    omitirConfirmacion,
    marcarOmitirConfirmacion,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
