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
        '@codemirror/autocomplete',
        '@codemirror/commands',
        '@codemirror/language',
        '@codemirror/lint',
        '@codemirror/search',
        '@codemirror/lang-cpp',
        '@codemirror/lang-css',
        '@codemirror/lang-html',
        '@codemirror/lang-java',
        '@codemirror/lang-javascript',
        '@codemirror/lang-json',
        '@codemirror/lang-markdown',
        '@codemirror/lang-php',
        '@codemirror/lang-python',
        '@codemirror/lang-rust',
        '@codemirror/lang-sql',
        '@codemirror/state',
        '@codemirror/view',
      ],
      output: {
        chunkFileNames: '[hash].js',
      },
    },
  },
  plugins: [solidPlugin(), dts()],
});
