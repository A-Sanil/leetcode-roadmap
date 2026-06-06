import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../release/dist',
    emptyOutDir: true,
  },
  server: {
    // In dev, proxy /api calls to the Express server
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
