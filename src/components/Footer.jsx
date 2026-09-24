// Pie discreto al final del <main>. Cae sobre la cordillera, así que va en
// una pastilla de papel (regla de contraste: nada de texto directo sobre la
// montaña): opaca en móvil y translúcida con desenfoque solo desde md:.
function Footer() {
  return (
    <footer data-no-print className="mt-auto flex w-full justify-center px-4 pb-4 pt-6">
      <p className="rounded-full bg-papel px-3 py-1 font-eyebrow text-[10px] uppercase leading-4 tracking-[0.1em] text-on-surface-variant md:bg-papel-velo md:backdrop-blur-md">
        © LEGUMEX · Todos los derechos reservados.
      </p>
    </footer>
  )
}

export default Footer
