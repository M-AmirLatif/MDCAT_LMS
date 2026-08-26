import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
    // Target modern browsers for smaller output
    target: 'es2020',
    // Split vendor and feature chunks for better caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — changes rarely, long-term cacheable
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react'
          }
          // React Router — separate from React core
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router'
          }
          // Recharts + d3 dependencies — large charting lib, only needed on
          // dashboard/performance pages
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-charts'
          }
          // Axios — HTTP client
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios'
          }
          // Remaining node_modules
          if (id.includes('node_modules/')) {
            return 'vendor-misc'
          }
        },
      },
    },
    // Increase chunk warning threshold (vendor-charts is expected to be large)
    chunkSizeWarningLimit: 300,
  },
})
