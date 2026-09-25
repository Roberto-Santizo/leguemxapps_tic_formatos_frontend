/**
 * Placeholder estático para módulos cuyo backend (Laravel) todavía no expone
 * los endpoints necesarios. No hace ninguna llamada a la API -- es solo
 * presentación, para que la pantalla exista y se vea bien en la navegación
 * sin intentar hablarle a un backend que aún no responde eso.
 *
 * Se retira cuando el endpoint correspondiente exista: en ese punto la
 * página vuelve a construirse contra la API real.
 *
 * `migas` (opcional, solo texto del eyebrow): ruta de la pantalla en formato
 * "Sección / Subsección" (p. ej. "Historial / Desecho"); se pinta en
 * mayúsculas como en el resto de cabeceras. Sin `migas` no se pinta eyebrow
 * (nunca "LEGUMEX / X": el primer nivel es la sección).
 */
function EnConstruccion({ icon: Icon, titulo, descripcion, migas = '' }) {
  return (
    <div className="flex-1 animate-view-in px-4 pt-6 pb-10 tablet:px-8 tablet:pt-8 md:px-8 md:pt-10">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <div className="min-w-0">
          {migas && (
            <div className="mb-1.5 flex items-center gap-3 font-eyebrow text-eyebrow uppercase text-on-surface-variant">
              <span aria-hidden="true" className="h-px w-7 bg-outline" />
              {migas}
            </div>
          )}
          <h1 className="font-display-lg text-titulo-movil md:text-display-lg text-on-surface">{titulo}</h1>
        </div>

        <div className="animate-pop-in rounded-tarjeta bg-white px-6 py-16 shadow-tarjeta sm:px-10">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
            {Icon && (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surface-container-high text-on-surface">
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <h2 className="font-headline-md text-headline-md text-on-surface">Próximamente</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{descripcion}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnConstruccion
