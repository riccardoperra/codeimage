import * as path from 'path';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./test/before-test.ts'],
    deps: {
      inline: ['@fastify/autoload'],
    },
  },
  resolve: {
    alias: {
      '@api/domain': path.resolve('src/common/domainFunctions/functions.d.ts'),
    },
  },
});
