import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  server: {
    port: 8081,
    proxy: {
      '/v2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
