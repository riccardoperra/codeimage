import {defineConfig} from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/public-api.ts'),
      name: '@codeimage/locale',
      fileName: 'locale',
      formats: ['es'],
    },
    cssCodeSplit: true,
    rollupOptions: {
      external: ['solid-js'],
      output: {},
    },
  },
  plugins: [dts()],
});
