import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // /storage/... (firmas) se pasa al backend Laravel desde el MISMO servidor
  // del frontend: el PDF necesita la firma como imagen del mismo origen para
  // poder capturarla (ver firmaParaPdf en src/pdf/datosPdf.js). Misma base que
  // STORAGE_BASE_URL de api.js. En Docker lo hace nginx (docker/entrypoint.sh).
  const env = loadEnv(mode, process.cwd(), '')
  const storage = (env.VITE_STORAGE_URL || (env.VITE_AUTH_API_URL || '').replace(/\/api\/?$/, '')).replace(/\/+$/, '')
  const proxy = storage ? { '/storage': { target: storage, changeOrigin: true } } : undefined

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy,
    },
    preview: { proxy },
  }
})
