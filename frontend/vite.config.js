import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildId = "-"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    drop: ['console', 'debugger'],
  },
  define: {
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },
  server: {
    proxy: {
      '/api/public/stats': 'http://localhost:5000',
    },
  },
  build: {
    target: 'es2020',
    modulePreload: false,
    chunkSizeWarningLimit: 300,
  },
})