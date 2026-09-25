/*
  Breakpoints por DISPOSITIVO, no solo por ancho: el diseño de escritorio
  (sidebar, tablas, dos columnas) es para mouse o trackpad (puntero fino con
  hover). Toda pantalla táctil -- teléfono o tablet, vertical u horizontal --
  recibe el diseño móvil (menú hamburguesa, tarjetas, firmas una debajo de
  otra), aunque mida 1024 o 1366px como una laptop. Solo el ancho no las
  distingue: un iPad Pro horizontal mide lo mismo que una laptop de 1366.
  `tablet:` es el diseño móvil agrandado para una tablet (táctil, 600px o más
  de ancho Y de alto):
  mismas pantallas, con el tamaño de la tablet en vez del de un teléfono.
  `tablet-h:` es la tablet horizontal (táctil desde 1000px): las listas de
  tarjetas pasan a dos columnas.
  Las media queries de index.css usan la misma condición (ESCRITORIO).
*/
const ESCRITORIO = '(hover: hover) and (pointer: fine)'
const desde = (px) => ({ raw: `(min-width: ${px}px) and ${ESCRITORIO}` })

// Tamaños del sistema (letra, espacios, radios) en rem: a 16px de base son
// EXACTAMENTE los mismos píxeles de siempre en escritorio y teléfono; en
// tablet index.css sube la base y todo el diseño móvil crece en proporción.
const rem = (px) => `${px / 16}rem`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  // `hover:` solo donde hay hover de verdad (mouse/trackpad): en teléfono y
  // tablet el estado hover se quedaba "pegado" después de tocar una tarjeta.
  future: { hoverOnlyWhenSupported: true },
  theme: {
    screens: {
      sm: desde(640),
      md: desde(768),
      lg: desde(1024),
      xl: desde(1280),
      '2xl': desde(1536),
      // Tablet = táctil y de al menos 600px en AMBOS lados: un teléfono
      // horizontal (844×390) es ancho pero no alto, y sigue siendo teléfono.
      tablet: { raw: '(min-width: 600px) and (min-height: 600px) and (hover: none) and (pointer: coarse)' },
      // Tablet horizontal: hay ancho para dos columnas de tarjetas.
      'tablet-h': { raw: '(min-width: 1000px) and (min-height: 600px) and (hover: none) and (pointer: coarse)' },
    },
    extend: {
      colors: {
        /*
          ==========================================================================
          LEGUMEX · Control Operativo — sistema visual "Sierra" (SOLO MODO CLARO)
          --------------------------------------------------------------------------
          Se conservan los MISMOS nombres de token Material 3 que ya usan todas las
          pantallas; solo cambian los valores, para que el rediseño llegue a todo el
          sistema sin tocar cada className:
            - papel cálido #f4f5f1 de fondo, superficies blancas encima;
            - tinta #171717 para títulos y CTA negros, #525252 / #737373 de apoyo;
            - bordes #e5e5e5; activos suaves / paneles de solo lectura #ebede7.
          El verde de marca (bosque, brote, línea, éxito) vive en tokens aparte y
          se usa SOLO en marca/login/cordillera: en la app no hay verde en
          superficies ni textos. El rojo queda reservado para eliminar / errores.
          ==========================================================================
        */
        background: '#f4f5f1',
        'on-background': '#171717',

        surface: '#ffffff',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#fafafa',
        'surface-container': '#f5f5f5',
        'surface-container-high': '#ebede7',
        'surface-container-highest': '#e5e5e5',
        'surface-dim': '#dcdcd6',
        'surface-variant': '#e5e5e5',
        'surface-blue': '#f5f5f5',
        'header-fill': '#f5f5f5',
        'surface-tint': '#171717',

        'on-surface': '#171717',
        'on-surface-variant': '#525252',
        'on-surface-subtle': '#737373',

        outline: '#a3a3a3',
        'outline-variant': '#e5e5e5',
        'border-muted': '#e5e5e5',

        primary: '#171717',
        'on-primary': '#ffffff',
        'primary-container': '#ebede7',
        'on-primary-container': '#171717',
        'primary-fixed': '#ebede7',
        'primary-fixed-dim': '#d4d4d4',
        'on-primary-fixed': '#171717',
        'on-primary-fixed-variant': '#404040',
        'inverse-primary': '#d4d4d4',

        secondary: '#525252',
        'secondary-container': '#f5f5f5',
        'on-secondary-container': '#262626',
        'secondary-fixed': '#f5f5f5',
        'secondary-fixed-dim': '#d4d4d4',
        'on-secondary-fixed': '#262626',
        'on-secondary-fixed-variant': '#404040',

        tertiary: '#171717',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#171717',
        'on-tertiary-container': '#737373',
        'tertiary-fixed': '#e5e5e5',
        'tertiary-fixed-dim': '#d4d4d4',
        'on-tertiary-fixed': '#171717',
        'on-tertiary-fixed-variant': '#404040',

        'inverse-surface': '#262626',
        'inverse-on-surface': '#f5f5f5',

        error: '#b3453b',
        'on-error': '#ffffff',
        'error-container': '#f1dcd9',
        'on-error-container': '#7a2f27',

        /*
          Estado de un equipo en Catálogo → Equipos (badge de EquiposList.jsx):
          Disponible (verde) / En posesión (ámbar). Son los únicos acentos
          además del rojo `error`, y siguen su misma receta para no desentonar
          con los grises: fondo muy claro, texto oscuro y un punto intermedio,
          todo con la saturación apagada del ladrillo #b3453b -- verde salvia
          y ocre, no el verde/ámbar de fábrica de Tailwind. Texto sobre fondo
          con contraste >= 4.5:1 (AA) en ambos.
        */
        available: '#5b8a6b',
        'available-container': '#e3ede5',
        'on-available-container': '#3f6b4f',
        assigned: '#b58a3e',
        'assigned-container': '#f3ead6',
        'on-assigned-container': '#7a5a1e',

        /* ── Tokens nuevos del sistema Sierra ─────────────────────────────── */
        papel: '#f4f5f1', // fondo de página (mismo valor que `background`)
        'papel-velo': 'rgba(244, 245, 241, 0.9)', // velo sobre la cordillera (sin blur: la sierra deriva y el blur repinta cada cuadro)
        tinta: '#0a0a0a', // botón primario negro
        'tinta-hover': '#262626', // hover del botón primario
        // Marca: solo login, logo y cordillera de fondo.
        bosque: '#0b2a1e',
        brote: '#4d7c2a',
        linea: '#9bc96a',
        exito: '#15803d',
        // Foco de teclado y enlaces.
        foco: '#2563eb',
        'foco-hover': '#1e40af',
      },
      borderRadius: {
        DEFAULT: '0.625rem',
        lg: '0.875rem',
        xl: '1rem',
        full: '9999px',
        boton: rem(8), // botones e inputs del mockup
        tarjeta: rem(16), // tarjetas y paneles blancos
        menu: rem(10), // ítems del menú lateral y botón de la barra móvil
        aviso: rem(22), // pastilla del Toast
        casilla: rem(4), // checkbox (ConfirmDialog "no volver a preguntar")
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        // Tarjeta blanca del mockup: sombra corta + filete de 1px en vez de borde.
        tarjeta: '0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px #e5e5e5',
        // Variantes del filete para cajas sin borde propio (Buscador): hover
        // gris medio y foco en tinta de 2px (mismo grosor que los inputs).
        'tarjeta-hover': '0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px #a3a3a3',
        'tarjeta-foco': '0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 2px #171717',
        // Paneles flotantes (menús, avisos, cajón móvil) con la sombra verde larga.
        flotante: '0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px #e5e5e5, 0 24px 48px -24px rgba(11, 42, 30, 0.3)',
        modal: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        toast: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        cajon: '0 0 0 1px #e5e5e5, 24px 0 48px -24px rgba(11, 42, 30, 0.35)',
        'barra-movil': '0 1px 0 #e5e5e5',
        'barra-inferior': '0 -1px 0 #e5e5e5',
      },
      spacing: {
        'stack-xs': rem(4),
        'container-padding': rem(16),
        'stack-md': rem(16),
        'column-gap': rem(20),
        'stack-lg': rem(24),
        'drawer-width': rem(240),
        'stack-sm': rem(8),
        'barra-movil': rem(56),
        4.5: '1.125rem',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        'body-lg': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'headline-md': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'body-md': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'headline-lg': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'display-lg': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'label-sm': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'label-bold': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        eyebrow: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        // Papel aprobado (hoja de entrega/devolución en pantalla): conserva la
        // tipografía de origin/main para el título, que era Manrope. Se usa
        // SOLO dentro del papel: `font-papel text-titulo-papel`.
        papel: ['Manrope', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'body-lg': [rem(16), { lineHeight: rem(24), fontWeight: '400' }],
        'headline-md': [rem(18), { lineHeight: rem(24), letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-md': [rem(14), { lineHeight: rem(20), fontWeight: '400' }],
        'headline-lg': [rem(24), { lineHeight: rem(30), letterSpacing: '-0.03em', fontWeight: '700' }],
        // Título de pantalla del mockup (32px, 800, tracking -0.04em).
        'display-lg': [rem(32), { lineHeight: rem(38), letterSpacing: '-0.04em', fontWeight: '800' }],
        'label-sm': [rem(11), { lineHeight: rem(14), fontWeight: '500' }],
        'label-bold': [rem(12), { lineHeight: rem(16), fontWeight: '700' }],
        // Eyebrow / encabezado de tabla / contador: mono 11px en mayúsculas.
        eyebrow: [rem(11), { lineHeight: rem(16), letterSpacing: '0.12em', fontWeight: '400' }],
        // Tamaños sueltos que antes iban como text-[12px] / text-[11px] / text-[26px]:
        //  - meta: metadatos, labels de formulario, códigos en tabla (12px).
        //  - micro: etiquetas mono de tabla/paginador/chips (11px); el tracking se
        //    combina aparte: `font-mono text-micro tracking-[0.1em] uppercase`.
        //  - titulo-movil: título de pantalla en móvil (26px / 800 / -0.04em);
        //    en escritorio sigue `md:text-display-lg`.
        meta: [rem(12), { lineHeight: rem(16) }],
        micro: [rem(11), { lineHeight: rem(14) }],
        // Inputs en móvil: 16px evita el zoom automático de iOS al enfocar.
        'input-movil': [rem(16), { lineHeight: rem(24) }],
        'titulo-movil': [rem(26), { lineHeight: rem(30), letterSpacing: '-0.04em', fontWeight: '800' }],
        //  - nano: marca del menú, pie y chip "Corregida aquí" (mono 10px).
        //  - titulo-modal: título de ConfirmDialog y EquipoDetalleModal.
        //  - titulo-papel: título del papel ("Hoja de Entrega de Equipo"...),
        //    idéntico al `headline-lg` de origin/main + font-extrabold que
        //    aprobó el cliente; va con `font-papel` (Manrope).
        nano: [rem(10), { lineHeight: rem(16) }],
        'titulo-modal': [rem(20), { lineHeight: rem(28), letterSpacing: '-0.02em', fontWeight: '600' }],
        'titulo-papel': [rem(24), { lineHeight: rem(32), letterSpacing: '-0.02em', fontWeight: '800' }],
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        page: '280ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        salida: 'cubic-bezier(0.22, 1, 0.36, 1)',
        rebote: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      // Solo los keyframes que usa alguna pantalla (el resto del catálogo del
      // mockup -- modalIn/Out, dockIn, numBump... -- se podó por no tener uso).
      keyframes: {
        popIn: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        dropIn: { from: { opacity: '0', transform: 'translateY(-4px)' }, to: { opacity: '1', transform: 'none' } },
        hintIn: { from: { opacity: '0', transform: 'translateY(-3px)' }, to: { opacity: '1', transform: 'none' } },
        overlayIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        toastIn: { from: { opacity: '0', transform: 'translate(24px, -16px)' }, to: { opacity: '1', transform: 'none' } },
        toastInAbajo: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'none' } },
        cardRise: { from: { opacity: '0', transform: 'translateY(24px) scale(0.98)' }, to: { opacity: '1', transform: 'none' } },
        badgePop: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'none', opacity: '1' },
        },
        iconPop: { '0%': { transform: 'scale(1)' }, '45%': { transform: 'scale(1.22)' }, '100%': { transform: 'none' } },
        shimmer: { '0%': { backgroundPosition: '100% 0' }, '100%': { backgroundPosition: '-100% 0' } },
        sierraRise: { from: { transform: 'translateY(28px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
        sierraDrift: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        'pop-in': 'popIn 200ms cubic-bezier(0.4, 0, 0.2, 1) backwards',
        'drop-in': 'dropIn 150ms cubic-bezier(0.4, 0, 0.2, 1) backwards',
        'hint-in': 'hintIn 150ms cubic-bezier(0.4, 0, 0.2, 1) backwards',
        'overlay-in': 'overlayIn 200ms cubic-bezier(0.4, 0, 0.2, 1) backwards',
        'toast-in': 'toastIn 280ms cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'toast-in-abajo': 'toastInAbajo 280ms cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'card-rise': 'cardRise 600ms cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'badge-pop': 'badgePop 360ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards',
        'icon-pop': 'iconPop 420ms cubic-bezier(0.4, 0, 0.2, 1) backwards',
        shimmer: 'shimmer 1.4s linear infinite',
        'sierra-rise': 'sierraRise 1200ms cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'sierra-lenta': 'sierraDrift 120s linear infinite',
        'sierra-media': 'sierraDrift 80s linear infinite reverse',
        'sierra-rapida': 'sierraDrift 52s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
    // `movil:` = todo lo que no es `sm:` (teléfono, tablet, o ventana de
    // escritorio de menos de 640px). Reemplaza a `max-sm:`, que Tailwind no
    // genera cuando los breakpoints llevan condición de dispositivo.
    ({ addVariant }) => addVariant('movil', `@media not all and (min-width: 640px) and ${ESCRITORIO}`),
  ],
}
