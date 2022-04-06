import {defineConfig} from 'vite';
import {resolve, parse} from 'path';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';
import {dependencies, peerDependencies} from './package.json';
// const isExternal = (id: string) => !id.startsWith('.') && !path.isAbsolute(id);

module.exports = defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@codeimage/ui',
      fileName: 'ui',
      formats: ['es'],
    },
    cssCodeSplit: true,
    rollupOptions: {
      external: [
        ...Object.keys(dependencies),
        ...Object.keys(peerDependencies),
      ],
      output: {
        entryFileNames: '[name].js',
        esModule: true,
        preserveModules: true,
        globals: {
          'solid-js': 'solid-js',
        },
      },
    },
  },
  plugins: [solidPlugin(), dts()],
});
