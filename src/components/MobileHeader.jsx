import { Menu } from 'lucide-react'

// Barra superior móvil del sistema Sierra: 56px sobre papel OPACO (al 95% se
// leía el texto que pasa por debajo; y sin desenfoque: en móvil el blur sobre
// contenido que scrollea da tirones), con
// el botón que abre el cajón a la IZQUIERDA (mismo lado del que entra el
// cajón y mismo lugar de siempre), el isotipo y el nombre del sistema en mono.
function MobileHeader({ onAbrirMenu }) {
  return (
    <header
      data-no-print
      className="fixed inset-x-0 top-0 z-30 flex h-barra-movil items-center gap-1 bg-papel pl-1.5 pr-4 shadow-barra-movil md:hidden"
    >
      <button
        aria-label="Abrir menú"
        onClick={onAbrirMenu}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-menu text-on-surface transition-[transform,background-color] duration-fast ease-standard active:scale-[0.90] active:bg-surface-container-high"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <img src="/logo-legumex-icon.png" alt="" aria-hidden="true" className="block h-7 w-auto shrink-0" />
        <span className="min-w-0 truncate font-eyebrow text-eyebrow uppercase tracking-[0.1em] text-on-surface-variant">
          LEGUMEX · Control Operativo
        </span>
      </div>
    </header>
  )
}

export default MobileHeader
