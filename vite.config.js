// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://26.107.178.117:5000',  // <-- Use your Radmin VPN IP
        changeOrigin: true,
        secure: false,
      },
      '/posts': {
        target: 'http://26.107.178.117:5000',  // <-- Use your Radmin VPN IP
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
