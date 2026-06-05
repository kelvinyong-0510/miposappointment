import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // Sunmi K2 (Android 9) and similar old WebViews don't run Vite's default
    // ES-module bundle. plugin-legacy emits a `nomodule` SystemJS bundle +
    // core-js polyfills that those engines run, while modern devices keep using
    // the fast module bundle. Covers the white-screen on old kiosks.
    legacy({
      targets: ['chrome >= 51', 'safari >= 10'],
      modernPolyfills: true,
    }),
  ],
  build: {
    target: ['chrome64', 'es2015'],
  },
})
