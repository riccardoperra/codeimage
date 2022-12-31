import path from 'path';
import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';
import {dependencies, peerDependencies} from './package.json';

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/public-api.ts'),
      name: '@codeimage/dom-export',
      fileName: 'dom-export',
      formats: ['es'],
    },
    cssCodeSplit: true,
    rollupOptions: {
      external: [
        ...Object.keys(dependencies),
        ...Object.keys(peerDependencies),
      ],
      output: {},
    },
  },
  plugins: [dts()],
});
