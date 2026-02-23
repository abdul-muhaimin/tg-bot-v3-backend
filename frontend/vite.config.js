import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: false,
    cors: {
      origin: 'https://becki-nonstatutable-jeni.ngrok-free.dev',
      credentials: true,
    },
    allowedHosts: [
      'becki-nonstatutable-jeni.ngrok-free.dev',
      'complicated-conditional-students-tenant.trycloudflare.com',
    ],
  }
})