import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid({ssr: true})],
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
