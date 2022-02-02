import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  clearScreen: true,
  plugins: [solidPlugin()],
  server: {
    strictPort: true,
    port: 4200,
    watch: {
      usePolling: true,
    },
  },
  build: {
    target: 'es2019',
    brotliSize: true,
    sourcemap: true,
    minify: true,
    polyfillDynamicImport: false,
  },
});
