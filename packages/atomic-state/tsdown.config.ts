import {defineConfig} from 'tsdown';
import solid from 'rolldown-plugin-solid';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  clean: true,
  sourcemap: true,
  plugins: [solid()],
});
