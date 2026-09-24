/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
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
        'papel-velo': 'rgba(244, 245, 241, 0.9)', // cabeceras sobre la cordillera (+ blur 12px)
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
        boton: '8px', // botones e inputs del mockup
        tarjeta: '16px', // tarjetas y paneles blancos
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        // Tarjeta blanca del mockup: sombra corta + filete de 1px en vez de borde.
        tarjeta: '0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px #e5e5e5',
        // Paneles flotantes (menús, avisos, cajón móvil) con la sombra verde larga.
        flotante: '0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px #e5e5e5, 0 24px 48px -24px rgba(11, 42, 30, 0.3)',
        modal: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        toast: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        cajon: '0 0 0 1px #e5e5e5, 24px 0 48px -24px rgba(11, 42, 30, 0.35)',
        'barra-movil': '0 1px 0 #e5e5e5',
        'barra-inferior': '0 -1px 0 #e5e5e5',
      },
      spacing: {
        'stack-xs': '4px',
        'container-padding': '16px',
        'stack-md': '16px',
        'column-gap': '20px',
        'stack-lg': '24px',
        'drawer-width': '240px',
        'stack-sm': '8px',
        'barra-movil': '56px',
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
      },
      fontSize: {
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'headline-md': ['18px', { lineHeight: '24px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'headline-lg': ['24px', { lineHeight: '30px', letterSpacing: '-0.03em', fontWeight: '700' }],
        // Título de pantalla del mockup (32px, 800, tracking -0.04em).
        'display-lg': ['32px', { lineHeight: '38px', letterSpacing: '-0.04em', fontWeight: '800' }],
        'label-sm': ['11px', { lineHeight: '14px', fontWeight: '500' }],
        'label-bold': ['12px', { lineHeight: '16px', fontWeight: '700' }],
        // Eyebrow / encabezado de tabla / contador: mono 11px en mayúsculas.
        eyebrow: ['11px', { lineHeight: '16px', letterSpacing: '0.12em', fontWeight: '400' }],
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
      keyframes: {
        pageIn: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pageInFwd: { from: { opacity: '0', transform: 'translate(18px, 6px)' }, to: { opacity: '1', transform: 'translate(0, 0)' } },
        pageInBack: { from: { opacity: '0', transform: 'translate(-18px, 6px)' }, to: { opacity: '1', transform: 'translate(0, 0)' } },
        popIn: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        dropIn: { from: { opacity: '0', transform: 'translateY(-4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        hintIn: { from: { opacity: '0', transform: 'translateY(-3px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        modalIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        modalOut: { from: { opacity: '1', transform: 'scale(1)' }, to: { opacity: '0', transform: 'scale(0.95)' } },
        overlayIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        overlayOut: { from: { opacity: '1' }, to: { opacity: '0' } },
        toastIn: { from: { opacity: '0', transform: 'translate(24px, -16px)' }, to: { opacity: '1', transform: 'translate(0, 0)' } },
        toastOut: { from: { opacity: '1' }, to: { opacity: '0' } },
        dockIn: { from: { opacity: '0', transform: 'translateY(16px) scale(0.98)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        cardRise: { from: { opacity: '0', transform: 'translateY(24px) scale(0.98)' }, to: { opacity: '1', transform: 'none' } },
        badgePop: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        iconPop: { '0%': { transform: 'scale(1)' }, '45%': { transform: 'scale(1.22)' }, '100%': { transform: 'scale(1)' } },
        checkDraw: { from: { strokeDashoffset: '26' }, to: { strokeDashoffset: '0' } },
        shimmer: { '0%': { backgroundPosition: '100% 0' }, '100%': { backgroundPosition: '-100% 0' } },
        numBump: { '0%': { transform: 'translateY(-4px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        sierraRise: { from: { transform: 'translateY(28px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        sierraDrift: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        'page-in': 'pageIn 280ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'page-in-fwd': 'pageInFwd 280ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'page-in-back': 'pageInBack 280ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'pop-in': 'popIn 200ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'drop-in': 'dropIn 150ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'hint-in': 'hintIn 150ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'modal-in': 'modalIn 200ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'modal-out': 'modalOut 150ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'overlay-in': 'overlayIn 200ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'overlay-out': 'overlayOut 150ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'toast-in': 'toastIn 280ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'toast-out': 'toastOut 150ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'dock-in': 'dockIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'card-rise': 'cardRise 600ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'badge-pop': 'badgePop 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'icon-pop': 'iconPop 420ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'check-draw': 'checkDraw 420ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'num-bump': 'numBump 200ms cubic-bezier(0.4, 0, 0.2, 1) both',
        shimmer: 'shimmer 1.4s linear infinite',
        'sierra-rise': 'sierraRise 1200ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'sierra-lenta': 'sierraDrift 120s linear infinite',
        'sierra-media': 'sierraDrift 80s linear infinite reverse',
        'sierra-rapida': 'sierraDrift 52s linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
}
