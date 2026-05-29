import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vintly web build -> compiled into the Android APK by Capacitor.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
})
