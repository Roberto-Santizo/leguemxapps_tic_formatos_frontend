/**
 * Placeholder estático para módulos cuyo backend (Laravel) todavía no expone
 * los endpoints necesarios. No hace ninguna llamada a la API -- es solo
 * presentación, para que la pantalla exista y se vea bien en la navegación
 * sin intentar hablarle a un backend que aún no responde eso.
 *
 * Se retira cuando el endpoint correspondiente exista: en ese punto la
 * página vuelve a construirse contra la API real.
 */
function EnConstruccion({ icon: Icon, titulo, descripcion }) {
  return (
    <div className="flex-1 animate-view-in p-container-padding md:p-stack-lg bg-background">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">{titulo}</h1>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm px-6 py-16 sm:px-10">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
            {Icon && (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary-container text-on-secondary-container">
                <Icon className="h-6 w-6" strokeWidth={2} />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Próximamente</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{descripcion}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnConstruccion
