import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 5173 is used by another local app; pin DRAGON to 5174.
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        // DRAGON backend runs on 8010 locally (port 8000 is used by another app).
        target: 'http://localhost:8010',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
