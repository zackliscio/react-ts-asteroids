import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { extname, relative, resolve } from 'path'
import { fileURLToPath } from 'node:url'
import { glob } from 'glob'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/index.tsx'),
      formats: ['es'],
    },
    copyPublicDir: false,
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
      input: Object.fromEntries(
               glob.sync('lib/**/*.{ts,tsx}', {
                 ignore: ["lib/**/*.d.ts"],
               }).map(file => [
                 // The name of the entry point
                 // lib/nested/foo.ts becomes nested/foo
                 relative(
                   'lib',
                   file.slice(0, file.length - extname(file).length)
                 ),
                 // The absolute path to the entry file
                 // lib/nested/foo.ts becomes /project/lib/nested/foo.ts
                 fileURLToPath(new URL(file, import.meta.url))
               ])
             )
    },
  },  
})
