import {defineConfig} from 'tsup';

export default defineConfig({
  entry: ['./src/**/*.ts'],
  bundle: false,
  platform: 'node',
  target: 'node18',
  format: ['esm'],
  sourcemap: true,
  clean: true,
  dts: false,
});
