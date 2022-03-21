import {defineConfig} from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

module.exports = defineConfig({
  build: {
    target: 'esnext',
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
        '@codemirror/highlight',
        '@codemirror/view',
      ],
      output: {},
    },
  },
  plugins: [dts()],
});
