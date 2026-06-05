import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    // Transpile modern syntax (?. ?? class fields) down so the app runs on the
    // Sunmi K2's old Android 9 WebView (Chrome ~66-72). Runtime API gaps are
    // covered by src/polyfills.js. Chrome 64 supports native ES modules.
    target: ['chrome64', 'es2015'],
  },
})
