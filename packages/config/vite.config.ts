import path from 'path';
import {defineConfig} from 'vite';
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
  plugins: [
    solidPlugin(),
    dts(),
    {
      name: 'fix_prettier_parser',
      transform(code, id) {
        if (
          (id.endsWith('/node_modules/java-parser/src/utils.js') &&
            code.includes('process')) ||
          code.includes('process.env.NODE_DEBUG')
        ) {
          console.log(id);
          return {
            code: [code, ';globalThis.process = globalThis.process;'].join(
              '\n',
            ),
            map: null,
          };
        }
        return;
      },
    },
  ],
});
