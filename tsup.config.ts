import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'browser/index': 'src/browser/index.ts',
    'storage/index': 'src/storage/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['react', 'react-dom'],
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
})


