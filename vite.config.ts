import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['recharts', 'd3-array', 'internmap']
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/v1': 'http://localhost:8000'
    }
  }
})
