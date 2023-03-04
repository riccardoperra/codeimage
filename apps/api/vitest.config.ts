import * as path from 'path';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@api/domain': path.resolve('src/common/domainFunctions/functions.d.ts'),
    },
  },
});
