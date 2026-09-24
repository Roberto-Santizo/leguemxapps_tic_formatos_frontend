// Pie discreto al final del <main>. Cae sobre la cordillera, así que va en
// una pastilla de papel translúcido con desenfoque (regla de contraste: nada
// de texto directo sobre la montaña).
function Footer() {
  return (
    <footer data-no-print className="mt-auto flex w-full justify-center px-4 pb-4 pt-6">
      <p className="rounded-full bg-papel-velo px-3 py-1 font-eyebrow text-[10px] uppercase leading-4 tracking-[0.1em] text-on-surface-variant backdrop-blur-md">
        © LEGUMEX · Todos los derechos reservados.
      </p>
    </footer>
  )
}

export default Footer
