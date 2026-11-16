import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@codeimage/config': fileURLToPath(
        new URL('../config/src/public-api.ts', import.meta.url),
      ),
      '@codeimage/highlight/themes': fileURLToPath(
        new URL('../highlight/src/lib/themes/index.ts', import.meta.url),
      ),
    },
  },
  test: {environment: 'node', testTimeout: 30_000},
});
