import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import Footer from '../components/Footer.jsx'
import SierraFondo from '../components/SierraFondo.jsx'
import CieloSistema from '../components/CieloSistema.jsx'
import { Toaster } from '../components/Toast.jsx'
import AvisoSesion from '../components/AvisoSesion.jsx'
import Recorrido from '../components/Recorrido.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { CLAVE_RECORRIDO, RECORRIDO_ADMIN, RECORRIDO_USUARIO } from '../config/recorrido.js'

// Recorrido ya visto por este usuario (por equipo: vive en localStorage).
function recorridoVisto(usuario) {
  try {
    return (JSON.parse(localStorage.getItem(CLAVE_RECORRIDO) || '[]') || []).includes(usuario)
  } catch {
    return true
  }
}

function marcarRecorridoVisto(usuario) {
  try {
    const vistos = JSON.parse(localStorage.getItem(CLAVE_RECORRIDO) || '[]') || []
    if (!vistos.includes(usuario)) localStorage.setItem(CLAVE_RECORRIDO, JSON.stringify([...vistos, usuario]))
  } catch {
    // sin almacenamiento: se volverá a ofrecer la próxima vez
  }
}

/*
  "Body" del sistema Sierra: papel cálido de fondo, la cordillera fija al pie
  (decorativa, z-0) y encima el shell -- menú lateral transparente sobre el
  papel y un <main data-sheet> que scrollea por dentro, transparente, para que
  las tarjetas blancas de cada pantalla floten sobre la montaña.

  Apilamiento: el shell es `relative` SIN z-index a propósito. Así pinta por
  encima de la sierra (va después en el DOM) pero no crea un contexto de
  apilamiento propio, y el cajón móvil (z-50), la barra superior (z-30) y las
  barras de acciones sticky (z-30) siguen compitiendo en el contexto raíz
  igual que antes. Los diálogos y el panel de SearchableSelect van por portal
  a document.body, así que no los afecta nada de esto.

  Canal de la barra de scroll: `md:[scrollbar-gutter:stable]` reserva siempre
  sus 8px para que el contenido no salte al pasar de una pantalla corta a una
  larga. Por eso las barras de acciones de las hojas NO van sticky dentro del
  <main> (quedaban 8px más cortas, con una franja de montaña): van `fixed`
  al pie del viewport, de `md:left-[240px]` (= w-drawer-width del menú) hasta
  el borde derecho, por encima del canal.
*/
function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [recorridoAbierto, setRecorridoAbierto] = useState(false)
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const recorrido = isAdmin ? RECORRIDO_ADMIN : RECORRIDO_USUARIO

  // "¿Cómo funciona?": arranca siempre desde el inicio del rol, con el menú cerrado.
  const iniciarRecorrido = useCallback(() => {
    setMenuAbierto(false)
    if (user?.username) marcarRecorridoVisto(user.username)
    if (pathname !== recorrido.inicio) navigate(recorrido.inicio)
    setRecorridoAbierto(true)
  }, [user, pathname, recorrido, navigate])

  // La primera vez de cada usuario se ofrece solo, si entra por su pantalla de inicio.
  useEffect(() => {
    if (!user?.username || recorridoVisto(user.username) || pathname !== recorrido.inicio) return undefined
    const t = setTimeout(iniciarRecorrido, 900)
    return () => clearTimeout(t)
    // solo al entrar; no cada vez que cambia la ruta
  }, [user?.username])

  return (
    <div className="h-full font-body-lg text-on-surface">
      <CieloSistema />
      <SierraFondo />

      <MobileHeader onAbrirMenu={() => setMenuAbierto(true)} />

      <div data-shell className="relative flex h-full overflow-hidden">
        <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} onAyuda={iniciarRecorrido} />

        <main
          data-sheet
          className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain scroll-pb-36 pt-barra-movil md:pt-0 md:[scrollbar-gutter:stable]"
        >
          <Outlet />
          <Footer />
        </main>
      </div>

      {/* Avisos de "ya quedó / no se pudo". Se monta una sola vez aquí; las
          pantallas solo llaman mostrarToast() -- no hay provider ni props. */}
      <Toaster />
      {/* Cuenta regresiva de los últimos 5 minutos de la sesión. */}
      <AvisoSesion />
      {recorridoAbierto && (
        <Recorrido pasos={recorrido.pasos} onMenu={setMenuAbierto} onCerrar={() => setRecorridoAbierto(false)} />
      )}
    </div>
  )
}

export default AppLayout
