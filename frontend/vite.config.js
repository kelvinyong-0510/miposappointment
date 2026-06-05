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
      // renderModernChunks:false → emit ONLY the fully-transpiled + core-js
      // legacy (SystemJS) bundle, loaded by EVERY browser. The Sunmi K2's
      // Chrome-66 WebView supports ES modules, so it was running the modern
      // bundle and ignoring the legacy fallback → blank. This makes it run the
      // robust bundle too. Negligible cost for a kiosk; guarantees it works.
      renderModernChunks: false,
    }),
  ],
  build: {
    target: ['chrome64', 'es2015'],
  },
})
