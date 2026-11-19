import path from 'path';
import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/public-api.ts'),
      name: '@codeimage/dom-export',
      fileName: 'dom-export',
      formats: ['es'],
    },
    cssCodeSplit: true,
  },
  plugins: [dts()],
});
