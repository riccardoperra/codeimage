import {defineConfig} from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/public-api.ts'),
      name: '@codegram/locale',
      fileName: 'locale',
      formats: ['es'],
    },
    cssCodeSplit: true,
    rollupOptions: {
      external: ['solid-js'],
      output: {},
    },
  },
  plugins: [solidPlugin(), dts()],
});
