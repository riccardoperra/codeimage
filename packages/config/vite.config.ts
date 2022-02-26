import {defineConfig} from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/public-api.ts'),
      name: '@codeimage/config',
      fileName: 'config',
      formats: ['es'],
    },
    cssCodeSplit: true,
    rollupOptions: {
      external: [
        'solid-js',
        '@codeimage/theme',
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/highlight',
        '@codemirror/lang-css',
        '@codemirror/lang-html',
        '@codemirror/lang-java',
        '@codemirror/lang-javascript',
        '@codemirror/lang-json',
        '@codemirror/lang-php',
        '@codemirror/lang-python',
        '@codemirror/lang-cpp',
        '@codemirror/lang-rust',
        '@codemirror/lang-markdown',
        '@codemirror/lang-sql',
      ],
      output: {
        chunkFileNames: '[hash].js',
      },
    },
  },
  plugins: [solidPlugin(), dts()],
});
