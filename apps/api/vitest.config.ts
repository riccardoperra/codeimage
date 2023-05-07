import * as path from 'path';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
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
