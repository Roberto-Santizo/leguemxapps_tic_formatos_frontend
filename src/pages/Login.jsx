import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, TriangleAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

// El telón verde solo se muestra la primera vez por sesión del navegador;
// si vuelve al login (cerrar sesión, sesión vencida) entra directo.
const CLAVE_TELON = 'legumex_telon_visto'
// Tiempo que se deja ver la animación de éxito antes de navegar.
const ESPERA_EXITO_MS = 1250

function telonYaVisto() {
  try {
    return sessionStorage.getItem(CLAVE_TELON) === '1'
  } catch (_) {
    return false
  }
}

function movimientoReducido() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function saludoSegunHora() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// Parte un texto en letras que saltan en ola (una tras otra cada 28 ms).
function LetrasEnOla({ texto, inicio }) {
  return Array.from(texto).map((letra, i) => (
    <span
      key={i}
      className="lg-letra"
      style={{ animationDelay: `${inicio + i * 28}ms` }}
    >
      {letra === ' ' ? ' ' : letra}
    </span>
  ))
}

// Crestas de las cuatro capas de cordillera (mismo dibujo que el diseño Sierra).
const CAPAS_SIERRA = [
  '0,240 0,90 140,55 300,85 430,30 600,70 760,20 920,65 1080,35 1280,90 1420,55 1580,85 1710,30 1880,70 2040,20 2200,65 2360,35 2560,90 2560,240',
  '0,240 0,60 170,10 340,50 520,0 700,45 870,4 1050,40 1190,12 1280,60 1450,10 1620,50 1800,0 1980,45 2150,4 2330,40 2470,12 2560,60 2560,240',
  '0,240 0,120 210,75 400,110 610,60 830,115 1020,80 1280,120 1490,75 1680,110 1890,60 2110,115 2300,80 2560,120 2560,240',
  '0,240 0,180 250,140 460,175 680,130 900,172 1100,145 1280,180 1530,140 1740,175 1960,130 2180,172 2380,145 2560,180 2560,240',
]

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Estado solo de presentación: telón, animación de éxito y sacudida de error.
  const [mostrarTelon] = useState(() => !telonYaVisto())
  const [exito, setExito] = useState(null) // { nombre } mientras corre la animación de éxito
  const [sacudir, setSacudir] = useState(false)
  const temporizador = useRef(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE_TELON, '1')
    } catch (_) {
      // sin sessionStorage (modo privado estricto): el telón sale siempre
    }
    return () => clearTimeout(temporizador.current)
  }, [])

  const redirectTo = location.state?.from?.pathname || '/'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const usuario = await login(username, password)
      // "user" queda restringido a Historial -- si no venía rebotado de una
      // ruta puntual (redirectTo por defecto "/"), mandarlo directo ahí en
      // vez de "/" (que ahora es admin-only y lo regresaría de todos modos).
      const destino = redirectTo === '/' && usuario?.role !== 'admin' ? '/historial' : redirectTo
      // Se deja ver "Credenciales correctas" antes de entrar al sistema.
      setExito({ nombre: (usuario?.name || '').trim().split(/\s+/)[0] || '' })
      temporizador.current = setTimeout(
        () => navigate(destino, { replace: true }),
        movimientoReducido() ? 400 : ESPERA_EXITO_MS,
      )
    } catch (err) {
      setError(err.message)
      setSacudir(true)
    } finally {
      setLoading(false)
    }
  }

  // Parallax: la posición del mouse (−0.5…0.5) mueve cada capa según su profundidad.
  function moverParallax(event) {
    const el = event.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', ((event.clientX - r.left) / r.width - 0.5).toFixed(3))
    el.style.setProperty('--my', ((event.clientY - r.top) / r.height - 0.5).toFixed(3))
  }

  function soltarParallax(event) {
    event.currentTarget.style.setProperty('--mx', '0')
    event.currentTarget.style.setProperty('--my', '0')
  }

  const ocupado = loading || Boolean(exito)

  return (
    <div
      className={`lg-raiz${mostrarTelon ? '' : ' lg-sin-telon'}`}
      onMouseMove={moverParallax}
      onMouseLeave={soltarParallax}
    >
      {mostrarTelon && (
        <div aria-hidden="true" className="lg-telon">
          <div className="lg-telon-fondo" />
          <svg className="lg-telon-borde" viewBox="0 0 1280 120" preserveAspectRatio="none">
            <polygon points="0,0 1280,0 1280,60 1100,25 900,58 680,10 460,55 250,20 0,60" />
          </svg>
          <div className="lg-telon-centro">
            <img src="/logo-legumex.png" alt="" className="lg-telon-logo" />
            <div className="lg-telon-linea">
              <span />
            </div>
          </div>
        </div>
      )}

      <div aria-hidden="true" className="lg-cielo">
        <div className="lg-sol" />
        <div className="lg-neblina" />
        <div className="lg-nubes" />
      </div>

      <div aria-hidden="true" className="lg-sierra">
        {CAPAS_SIERRA.map((puntos, i) => (
          <div key={i} className={`lg-capa lg-capa-${i + 1}`}>
            <svg viewBox="0 0 2560 240" preserveAspectRatio="none">
              <polygon points={puntos} />
            </svg>
          </div>
        ))}
      </div>

      <div className="lg-pie" aria-hidden="true">
        <span>FROM GUATEMALA TO THE WORLD</span>
        <span>GROWING QUALITY · DELIVERING TRUST</span>
      </div>

      {/* Columna de marca */}
      <div className="lg-copia">
        <img src="/logo-legumex.png" alt="Agroindustria Legumex" className="lg-copia-logo" />
        <div className="lg-copia-cuerpo">
          <div className="lg-eyebrow">EL TEJAR, CHIMALTENANGO · 14°38′N 90°47′W</div>
          <h2 className="lg-titular">
            <span>
              <span>Control de</span>
            </span>
            <span>
              <span>formatos TIC</span>
            </span>
          </h2>
          <p className="lg-bajada">
            Entrega y devolución de equipo del área TIC, con firmas y la hoja lista para imprimir.
          </p>
        </div>
      </div>

      {/* Tarjeta de acceso */}
      <div className="lg-lado-tarjeta">
        <div className={`lg-tarjeta${exito ? ' lg-ok' : ''}`}>
          {exito ? (
            <h1 aria-live="polite" className="lg-titulo lg-titulo-ok">
              <LetrasEnOla texto={exito.nombre ? `¡Hola, ${exito.nombre}!` : '¡Bienvenido!'} inicio={120} />
            </h1>
          ) : (
            <h1 className="lg-titulo">Iniciar sesión</h1>
          )}
          <p className="lg-saludo">{saludoSegunHora()}. Ingresa con tu usuario del sistema.</p>

          {error && (
            <div role="alert" className="lg-aviso">
              <TriangleAlert size={18} strokeWidth={1.75} aria-hidden="true" />
              <div>
                <div className="lg-aviso-titulo">No pudimos validar tus datos</div>
                <div className="lg-aviso-texto">{error}</div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={`lg-campos${sacudir ? ' lg-sacude' : ''}`}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) setSacudir(false)
            }}
          >
            <div className="lg-campo">
              <label htmlFor="login-usuario" className="lg-etiqueta">Usuario</label>
              <input
                id="login-usuario"
                className="lg-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="lg-campo">
              <label htmlFor="login-password" className="lg-etiqueta">Contraseña</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  className="lg-input lg-input-pwd"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={mostrarPassword}
                  title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                  className="lg-ojo"
                >
                  {mostrarPassword ? (
                    <EyeOff size={18} strokeWidth={1.75} />
                  ) : (
                    <Eye size={18} strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={ocupado} aria-busy={loading} className="lg-boton">
              {exito ? (
                <>
                  <svg
                    className="lg-check"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span className="inline-flex">
                    <LetrasEnOla texto="Credenciales correctas" inicio={60} />
                  </span>
                </>
              ) : loading ? (
                <>
                  <span aria-hidden="true" className="lg-isotipo">
                    <img src="/logo-legumex-icon.png" alt="" />
                    <img src="/logo-legumex-icon.png" alt="" />
                  </span>
                  Verificando…
                </>
              ) : (
                <>
                  <LogIn size={17} strokeWidth={1.75} aria-hidden="true" className="lg-boton-icono" />
                  Iniciar sesión
                </>
              )}
            </button>

            <p className="lg-nota">Acceso restringido a personal autorizado de LEGUMEX.</p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
