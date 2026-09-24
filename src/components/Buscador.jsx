import { Search } from 'lucide-react'

function Buscador({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="w-full relative">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-subtle"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      {/* Sistema "Sierra": caja blanca con el filete de sombra de las
          tarjetas (sin borde propio); al enfocar, el filete pasa a tinta. */}
      <input
        className="h-11 w-full rounded-boton border-0 bg-white pl-10 pr-4 font-body-md text-[16px] md:text-body-md text-on-surface shadow-tarjeta placeholder:text-on-surface-subtle transition-shadow duration-fast ease-standard hover:shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_1px_theme(colors.outline)] focus:outline-none focus:ring-0 focus:shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_1px_theme(colors.on-surface)] [&::-webkit-search-cancel-button]:cursor-pointer [&::-webkit-search-cancel-button]:opacity-60 [&::-webkit-search-cancel-button]:[filter:grayscale(1)]"
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default Buscador
