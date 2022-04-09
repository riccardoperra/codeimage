import {defineConfig} from 'vite';
import {resolve} from 'path';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';
import {dependencies, peerDependencies} from './package.json';

const externals = [
  ...Object.keys(dependencies),
  ...Object.keys(peerDependencies),
  'solid-js/web',
  'solid-js/store',
];

export default defineConfig({
  plugins: [
    solidPlugin(),
    dts({
      skipDiagnostics: false,
      logDiagnostics: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@codeimage/ui',
      fileName: 'ui',
      formats: ['es'],
    },
    target: 'esnext',
    rollupOptions: {
      external: externals,
      output: {
        entryFileNames: '[name].js',
        preserveModules: true,
        format: 'es',
      },
    },
  },
});
