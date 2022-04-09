import {resolve} from 'path';
import {defineConfig, Plugin} from 'vite';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';
import {dependencies, peerDependencies} from './package.json';

const externals = [
  ...Object.keys(dependencies),
  ...Object.keys(peerDependencies),
  'solid-js/web',
  'solid-js/store',
];

export function removeSideEffects(): Plugin {
  return {
    transform() {
      return {
        moduleSideEffects: 'no-treeshake',
      };
    },
  };
}

export default defineConfig({
  plugins: [
    solidPlugin(),
    dts({
      skipDiagnostics: false,
      logDiagnostics: true,
    }),
    // TODO: check possible issues --> why solid-js and @vanilla-extract/dynamic are imported in some files?
    removeSideEffects(),
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
