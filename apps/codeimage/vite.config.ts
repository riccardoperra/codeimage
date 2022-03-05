import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';

export default defineConfig({
  clearScreen: true,
  plugins: [solidPlugin(), vanillaExtractPlugin()],
  server: {
    strictPort: true,
    port: 4200,
    watch: {
      usePolling: true,
    },
    https: true,
  },
  build: {
    target: 'es2019',
    brotliSize: true,
    sourcemap: true,
    minify: true,
    polyfillDynamicImport: false,
    cssCodeSplit: true,
  },
});
