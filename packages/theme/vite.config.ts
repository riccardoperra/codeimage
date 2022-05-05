import {defineConfig} from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/public-api.ts'),
      name: '@codeimage/theme',
      fileName: 'theme',
      formats: ['es'],
    },
    cssCodeSplit: true,
    rollupOptions: {
      external: [
        '@codemirror/state',
        '@codemirror/language',
        '@codemirror/view',
        '@lezer/highlight',
      ],
      output: {},
    },
  },
  plugins: [dts()],
});
