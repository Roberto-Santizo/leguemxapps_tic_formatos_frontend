import { Menu } from 'lucide-react'

// Barra superior móvil del sistema Sierra: 56px sobre papel casi opaco, con el
// isotipo, el nombre del sistema en mono y el botón que abre el cajón.
function MobileHeader({ onAbrirMenu }) {
  return (
    <header
      data-no-print
      className="fixed inset-x-0 top-0 z-30 flex h-barra-movil items-center gap-0.5 bg-background/95 pl-2 pr-1.5 shadow-barra-movil md:hidden"
    >
      <div className="flex h-11 shrink-0 items-center px-2">
        <img src="/logo-legumex-icon.png" alt="Legumex" className="block h-7 w-auto" />
      </div>
      <span className="min-w-0 flex-1 truncate font-eyebrow text-eyebrow uppercase tracking-[0.1em] text-on-surface-variant">
        LEGUMEX · Control Operativo
      </span>
      <button
        aria-label="Abrir menú"
        onClick={onAbrirMenu}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] text-on-surface transition-[transform,background-color] duration-fast ease-standard active:scale-[0.90] active:bg-surface-container-high"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>
    </header>
  )
}

export default MobileHeader
