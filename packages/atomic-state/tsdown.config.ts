import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  platform: 'neutral',
  dts: true,
  exports: true,
  clean: true,
  sourcemap: true,
});
