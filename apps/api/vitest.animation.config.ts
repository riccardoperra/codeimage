import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    env: {FASTIFY_AUTOLOAD_TYPESCRIPT: '1'},
    server: {deps: {inline: ['@fastify/autoload']}},
    globalSetup: ['./test/setup-unit.ts'],
    include: ['./test/routes/v1/project/update.integration.test.ts'],
  },
});
