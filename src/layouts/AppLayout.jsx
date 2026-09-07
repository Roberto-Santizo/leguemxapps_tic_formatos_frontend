import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import Footer from '../components/Footer.jsx'
import { Toaster } from '../components/Toast.jsx'

function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="h-full bg-background font-body-lg text-on-surface flex overflow-hidden custom-scrollbar">
      <MobileHeader onAbrirMenu={() => setMenuAbierto(true)} />
      <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />

      <main className="flex-1 flex flex-col h-full md:ml-drawer-width pt-16 md:pt-0 overflow-y-auto bg-background">
        <Outlet />
        <Footer />
      </main>

      {/* Avisos de "ya quedó / no se pudo". Se monta una sola vez aquí; las
          pantallas solo llaman mostrarToast() -- no hay provider ni props. */}
      <Toaster />
    </div>
  )
}

export default AppLayout
