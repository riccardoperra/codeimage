import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: [
    'src/**/*.{ts,js}',
    '!src/**/test/**', // exclude any "test" folder
    '!src/**/test-helpers/**', // exclude any "test-helpers" folder
  ],
  unbundle: true,
  format: 'esm',
  treeshake: false,
  deps: {
    skipNodeModulesBundle: true
  }
});
