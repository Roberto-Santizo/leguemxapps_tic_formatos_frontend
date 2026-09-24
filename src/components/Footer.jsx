// Pie discreto al final del <main>. Cae sobre la cordillera, así que va en
// una pastilla de papel (regla de contraste: nada de texto directo sobre la
// montaña): papel opaco en todos los tamaños, como las barras y cabeceras
// (con velo al 90% la cordillera se transparentaba bajo el texto), y SIN
// backdrop-blur (la cordillera deriva sin fin y el blur la re-muestrearía en
// cada cuadro).
function Footer() {
  return (
    <footer data-no-print className="mt-auto flex w-full justify-center px-4 pb-4 pt-6">
      <p className="rounded-full bg-papel px-3 py-1 font-eyebrow text-nano uppercase tracking-[0.1em] text-on-surface-variant">
        © LEGUMEX · Todos los derechos reservados.
      </p>
    </footer>
  )
}

export default Footer
