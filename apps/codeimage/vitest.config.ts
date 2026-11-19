import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';
import solid from '@solidjs/vite-plugin';

export default defineConfig({
  plugins: [
    vanillaExtractPlugin({unstable_mode: 'transform'}),
    solid({ssr: true}),
  ],
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@codeimage/store': fileURLToPath(
        new URL('./src/state', import.meta.url),
      ),
    },
  },
  test: {include: ['src/**/*.test.ts'], environment: 'node'},
});
