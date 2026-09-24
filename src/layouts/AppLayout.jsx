import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import Footer from '../components/Footer.jsx'
import SierraFondo from '../components/SierraFondo.jsx'
import { Toaster } from '../components/Toast.jsx'

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
*/
function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="h-full bg-background font-body-lg text-on-surface">
      <SierraFondo />

      <MobileHeader onAbrirMenu={() => setMenuAbierto(true)} />

      <div data-shell className="relative flex h-full overflow-hidden">
        <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />

        <main
          data-sheet
          className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-barra-movil md:pt-0 md:[scrollbar-gutter:stable]"
        >
          <Outlet />
          <Footer />
        </main>
      </div>

      {/* Avisos de "ya quedó / no se pudo". Se monta una sola vez aquí; las
          pantallas solo llaman mostrarToast() -- no hay provider ni props. */}
      <Toaster />
    </div>
  )
}

export default AppLayout
