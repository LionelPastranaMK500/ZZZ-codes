// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    electron({
      // MAIN
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              // 👇 no empaquetes estos módulos nativos/auxiliares
              external: ['better-sqlite3', 'bindings', 'node-gyp-build'],
              output: {
                format: 'cjs',
                entryFileNames: 'main.js',
              },
            },
            // 👇 deja pasar require dinámicos (bindings busca el .node así)
            commonjsOptions: { ignoreDynamicRequires: true },
          },
        },
      },

      // PRELOAD
      preload: {
        input: path.join(process.cwd(), 'electron/preload.ts'),
        vite: {
          build: {
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: 'preload.js',
              },
            },
          },
        },
      },

      renderer: {},
    }),
  ],
})
