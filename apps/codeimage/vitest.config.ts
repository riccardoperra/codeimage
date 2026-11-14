import {defineConfig} from 'vitest/config';

export default defineConfig({
  resolve: {alias: {'solid-js': 'solid-js/dist/solid.js'}},
  test: {include: ['src/**/*.test.ts']},
});
