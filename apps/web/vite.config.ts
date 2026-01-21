import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Serve test-assets from workspace root
  publicDir: 'public',
  server: {
    fs: {
      // Allow serving files from the workspace root (for test-assets)
      allow: ['..', '../..'],
    },
  },
})
