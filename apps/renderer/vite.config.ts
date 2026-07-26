import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: Number(process.env.PORT ?? 5173),
    strictPort: true,
  },
  define: {
    'import.meta.env.VITE_APP_BACKEND_URL': JSON.stringify(
      process.env.VITE_APP_BACKEND_URL ?? process.env.APP_BACKEND_URL ?? '',
    ),
  },
})
