import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2023',
    // The Firebase SDK is deliberately one long-cached chunk.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Keep the Firebase SDK in its own long-cached chunk.
        manualChunks: (id) => (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase') ? 'firebase' : undefined),
      },
    },
  },
})
