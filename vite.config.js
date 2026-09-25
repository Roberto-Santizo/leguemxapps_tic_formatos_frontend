import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Solo buckets de S3: el proxy de firmas remotas no debe servir para pedir
// cualquier sitio desde el servidor del frontend.
const HOST_S3 = /^[a-z0-9.-]+\.amazonaws\.com$/i

/**
 * /firma-remota/<bucket>.amazonaws.com/<ruta>?<firma> -> https://<bucket>.amazonaws.com/<ruta>
 * Solo GET y solo imágenes. Mismo propósito que el proxy de /storage: el PDF
 * necesita la firma desde el MISMO origen (ver src/pdf/datosPdf.js). En Docker
 * lo hace nginx (docker/entrypoint.sh).
 */
function firmasRemotas() {
  const middleware = async (req, res, next) => {
    const m = /^\/([^/]+)(\/.*)$/.exec(req.url || '')
    if (req.method !== 'GET' || !m || !HOST_S3.test(m[1])) return next()
    try {
      const r = await fetch(`https://${m[1]}${m[2]}`)
      const tipo = r.headers.get('content-type') || ''
      if (!r.ok || !tipo.startsWith('image/')) {
        res.statusCode = r.ok ? 415 : r.status
        return res.end()
      }
      res.setHeader('Content-Type', tipo)
      res.end(Buffer.from(await r.arrayBuffer()))
    } catch {
      res.statusCode = 502
      res.end()
    }
  }
  return {
    name: 'firmas-remotas',
    // Con llaves y sin devolver nada: si el hook devuelve algo, Vite lo toma
    // como función para después de sus middlewares y el servidor no arranca.
    configureServer(server) {
      server.middlewares.use('/firma-remota', middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/firma-remota', middleware)
    },
  }
}

export default defineConfig(({ mode }) => {
  // /storage/... (firmas) se pasa al backend Laravel desde el MISMO servidor
  // del frontend: el PDF necesita la firma como imagen del mismo origen para
  // poder capturarla (ver firmaParaPdf en src/pdf/datosPdf.js). Misma base que
  // STORAGE_BASE_URL de api.js. En Docker lo hace nginx (docker/entrypoint.sh).
  const env = loadEnv(mode, process.cwd(), '')
  const storage = (env.VITE_STORAGE_URL || (env.VITE_AUTH_API_URL || '').replace(/\/api\/?$/, '')).replace(/\/+$/, '')
  const proxy = storage ? { '/storage': { target: storage, changeOrigin: true } } : undefined

  return {
    plugins: [react(), firmasRemotas()],
    server: {
      port: 5173,
      proxy,
    },
    preview: { proxy },
  }
})
