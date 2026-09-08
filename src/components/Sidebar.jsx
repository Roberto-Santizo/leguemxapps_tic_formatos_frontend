import { NavLink, useNavigate } from 'react-router-dom'
import { FilePlus2, ClipboardList, BookOpen, ShieldCheck, Users, LogOut, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

// Etiqueta visible del rol. Antes aquí se resolvía con un ternario que dejaba
// a "adminagricola" mostrándose como "Usuario", mientras la tabla de Usuarios
// lo llama "Admin Agrícola": el mismo rol con dos nombres según la pantalla.
// Esto es solo texto -- los permisos siguen saliendo de isAdmin, sin cambios.
const ETIQUETA_ROL = {
  admin: 'Administrador',
  adminagricola: 'Admin Agrícola',
  user: 'Usuario',
}

function NavItem({ to, icon: Icon, label, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 min-h-11 px-3 py-2.5 rounded-lg font-body-md transition-colors duration-150',
          isActive
            ? 'bg-primary-container text-on-primary-container font-bold'
            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={[
              'h-5 w-5 shrink-0 transition-transform group-hover:scale-110',
              isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface',
            ].join(' ')}
            strokeWidth={2}
          />
          <span className="font-label-bold text-label-bold truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function Sidebar({ abierto, onCerrar }) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    onCerrar?.()
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* Overlay: solo en móvil/tablet pequeña, cierra el menú al tocar fuera */}
      {abierto && (
        <div
          onClick={onCerrar}
          aria-hidden="true"
          className="fixed inset-0 bg-on-surface/40 z-40 md:hidden transition-opacity duration-300"
        />
      )}

      <nav
        className={[
          'flex flex-col bg-surface-container-lowest fixed left-0 top-0 h-full w-drawer-width max-w-[85vw] border-r border-outline-variant z-50',
          'transition-transform duration-300 ease-out shadow-2xl md:shadow-none',
          abierto ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-11 w-11 shrink-0 place-items-center">
              <img
                src="/logo-legumex-icon.png"
                alt="Legumex"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              {/* El sistema se llamaba distinto según dónde lo vieras:
                  "Control Operativo" aquí y "LEGUMEX" en el encabezado móvil.
                  Ahora el nombre es uno solo -- con el mismo tratamiento
                  tipográfico que usa MobileHeader -- y "Control Operativo"
                  baja a descriptor, que es lo que realmente es. */}
              <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface leading-tight truncate">
                LEGUMEX
              </h1>
              <p className="font-label-sm text-label-sm text-on-surface-variant leading-tight truncate">
                Control Operativo
              </p>
            </div>
          </div>
          {/* Botón cerrar: solo visible en móvil/tablet pequeña (drawer superpuesto) */}
          <button
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="md:hidden grid h-11 w-11 shrink-0 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface active:bg-surface-container-highest transition-colors active:scale-[0.97] transition-transform"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* Main Tabs */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
          {/*
            El primer ítem ya no es un formato concreto: ahora abre el
            selector de los seis formatos. Se deja SIN "end" para que quede
            marcado como activo también mientras se llena un formulario en
            /actas/:tipo/nueva -- el usuario nunca pierde la referencia de
            dónde está en la navegación.
          */}
          <NavItem to="/" icon={FilePlus2} label="Nueva Acta" onNavigate={onCerrar} />
          <NavItem to="/historial" icon={ClipboardList} label="Historial de Actas" onNavigate={onCerrar} />
          {/* Catálogo (marcas y departamentos): visible para cualquier
              usuario autenticado -- la API no pide rol admin para /brands
              ni /departments. Sin "end" para que siga activo dentro de
              /catalogo/marcas y /catalogo/departamentos. */}
          <NavItem to="/catalogo" icon={BookOpen} label="Catálogo" onNavigate={onCerrar} />
          {isAdmin && <NavItem to="/auditoria" icon={ShieldCheck} label="Auditoría" onNavigate={onCerrar} />}
          {isAdmin && <NavItem to="/usuarios" icon={Users} label="Usuarios" onNavigate={onCerrar} />}
        </div>

        {/* Footer: usuario actual + cerrar sesión */}
        <div className="px-4 pb-4 pt-4 border-t border-outline-variant shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-bold text-label-bold shrink-0">
              {user?.name?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="font-label-bold text-label-bold text-on-surface truncate">{user?.name}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant capitalize truncate">
                {ETIQUETA_ROL[user?.role] ?? 'Usuario'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 min-h-11 px-3 py-2.5 rounded-lg text-on-surface-variant font-body-md hover:bg-surface-container-high hover:text-on-surface transition-colors duration-150 group active:scale-[0.97] transition-transform"
          >
            <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" strokeWidth={2} />
            <span className="font-label-bold text-label-bold">Cerrar Sesión</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default Sidebar
