import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ercot-live': {
        target: 'https://www.ercot.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ercot-live/, '/content/cdr/html'),
      },
      '/ercot-api': {
        target: 'https://api.ercot.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ercot-api/, '/api'),
      },
    },
  },
})
