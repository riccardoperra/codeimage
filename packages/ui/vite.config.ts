import {defineConfig} from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';

// const isExternal = (id: string) => !id.startsWith('.') && !path.isAbsolute(id);

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: '@codeimage/ui',
      fileName: 'ui',
      formats: ['es'],
    },
    cssCodeSplit: true,
    rollupOptions: {
      external: [
        'solid-js',
        '@vanilla-extract/css',
        '@vanilla-extract/sprinkles',
        '@vanilla-extract/recipes',
        'solid-headless',
        'solid-use',
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
