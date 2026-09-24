import { NavLink, useNavigate } from 'react-router-dom'
import { FilePlus2, ClipboardList, BookOpen, Users, LogOut, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

// Solo quedan dos roles: admin (todas las funciones) y user (restringido a
// Historial: ver actas y corregir solo la fecha de encabezado y la fecha de
// cada registro). "adminagricola" se retiró.
const ETIQUETA_ROL = {
  admin: 'Administrador',
  user: 'Usuario',
}

// Ítem del menú con el estilo del aside Sierra: transparente sobre el papel;
// el activo va en tarjeta blanca con filete y sombra corta.
function NavItem({ to, icon: Icon, label, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'group flex h-11 items-center gap-2.5 rounded-[10px] px-2.5 font-body-md text-body-md',
          'transition-[transform,background-color,box-shadow,color] duration-fast ease-standard active:scale-[0.97]',
          isActive
            ? 'bg-surface-container-lowest font-medium text-on-surface shadow-tarjeta'
            : 'text-on-surface-variant hover:bg-surface-container-lowest/60 hover:text-on-surface active:bg-surface-container-high',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={[
              'h-[17px] w-[17px] shrink-0 transition-transform duration-base ease-rebote group-hover:scale-110',
              isActive ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-on-surface',
            ].join(' ')}
            strokeWidth={1.75}
          />
          <span className="truncate">{label}</span>
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
          data-no-print
          className="fixed inset-0 z-40 bg-tinta/30 animate-overlay-in md:hidden"
        />
      )}

      {/*
        Escritorio: columna de 240px dentro del shell, transparente sobre el
        papel y fija mientras el <main> scrollea. Móvil: cajón que entra desde
        la izquierda sobre el papel, con sombra verde larga.
      */}
      <nav
        data-no-print
        className={[
          'flex flex-col gap-7 overflow-y-auto overscroll-contain custom-scrollbar',
          'fixed left-0 top-0 bottom-0 z-50 w-[min(304px,86%)] bg-background px-3 pb-5 pt-5 shadow-cajon',
          'transition-[transform,visibility] duration-300 ease-salida',
          abierto ? 'visible translate-x-0' : 'invisible -translate-x-[106%]',
          'md:visible md:relative md:z-auto md:h-full md:w-drawer-width md:shrink-0 md:translate-x-0 md:bg-transparent md:pb-5 md:pt-6 md:shadow-none md:transition-none',
        ].join(' ')}
      >
        {/* Marca */}
        <div className="flex items-start justify-between gap-2 pl-2">
          <div className="flex min-w-0 flex-col gap-2.5 pt-1">
            <img src="/logo-legumex-icon.png" alt="" aria-hidden="true" className="block h-[34px] w-auto self-start" />
            {/* El sistema se llamaba distinto según dónde lo vieras:
                "Control Operativo" aquí y "LEGUMEX" en el encabezado móvil.
                Ahora el nombre es uno solo -- con el mismo tratamiento
                tipográfico que usa MobileHeader (mono, mayúsculas) -- y
                "Control Operativo" queda como descriptor, que es lo que
                realmente es. */}
            <h1 className="flex min-w-0 items-center gap-2 font-eyebrow text-[10px] uppercase leading-4 tracking-[0.12em] text-on-surface-variant">
              <span className="truncate">
                <span className="font-medium text-on-surface">LEGUMEX</span> · Control Operativo
              </span>
            </h1>
          </div>
          {/* Botón cerrar: solo visible en móvil/tablet pequeña (drawer superpuesto) */}
          <button
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] text-on-surface-variant transition-[transform,background-color] duration-fast ease-standard hover:bg-surface-container-lowest hover:text-on-surface active:scale-[0.90] active:bg-surface-container-high md:hidden"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Main Tabs */}
        <div className="flex flex-col gap-1">
          {/*
            El primer ítem ya no es un formato concreto: ahora abre el
            selector de los seis formatos. Se deja SIN "end" para que quede
            marcado como activo también mientras se llena un formulario en
            /actas/:tipo/nueva -- el usuario nunca pierde la referencia de
            dónde está en la navegación.
          */}
          {/* "user" queda restringido a Historial (ver + corregir fechas):
              Nueva Acta, Catálogo y Usuarios son solo para admin. */}
          {isAdmin && <NavItem to="/" icon={FilePlus2} label="Nueva Acta" onNavigate={onCerrar} />}
          <NavItem to="/historial" icon={ClipboardList} label="Historial de Actas" onNavigate={onCerrar} />
          {isAdmin && <NavItem to="/catalogo" icon={BookOpen} label="Catálogo" onNavigate={onCerrar} />}
          {isAdmin && <NavItem to="/usuarios" icon={Users} label="Usuarios" onNavigate={onCerrar} />}
        </div>

        {/* Tarjeta de perfil: usuario actual + cerrar sesión */}
        <div className="mt-auto flex flex-col gap-3 rounded-tarjeta bg-surface-container-lowest p-3 shadow-tarjeta">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline bg-surface-container-lowest text-[12px] font-semibold uppercase text-on-surface">
              {user?.name?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate font-body-md text-body-md font-medium text-on-surface">{user?.name}</p>
              <p className="truncate font-label-sm text-label-sm font-normal text-on-surface-subtle">
                {ETIQUETA_ROL[user?.role] ?? 'Usuario'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="group flex h-10 w-full items-center justify-center gap-2 rounded-boton border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-body-md font-medium text-on-surface transition-[transform,background-color] duration-fast ease-standard hover:bg-surface-container active:scale-[0.96] active:bg-surface-container-highest"
          >
            <LogOut
              className="h-[17px] w-[17px] shrink-0 text-on-surface-variant transition-[transform,color] duration-base ease-standard group-hover:translate-x-[3px] group-hover:scale-110 group-hover:text-error"
              strokeWidth={1.75}
            />
            Cerrar Sesión
          </button>
        </div>
      </nav>
    </>
  )
}

export default Sidebar
