import * as path from 'path';
import type {ViteUserConfig} from 'vitest/config';
import {defineConfig, mergeConfig} from 'vitest/config';

export default defineConfig(() => {
  const testType = process.env.RUN_TEST ?? 'unit';

  const config = defineConfig({
    test: {
      env: {
        FASTIFY_AUTOLOAD_TYPESCRIPT: '1',
      },
      server: {
        deps: {
          inline: ['@fastify/autoload'],
        },
      },
    },
    resolve: {
      alias: {
        '@api/domain': path.resolve(
          'src/common/domainFunctions/functions.d.ts',
        ),
      },
    },
  });

  if (testType === 'unit') {
    return mergeConfig(config, {
      test: {
        exclude: ['./test/**/*.integration.test.ts'],
        include: ['./test/**/*.test.ts'],
        globalSetup: ['./test/setup-unit.ts'],
      },
    });
  } else if (testType === 'integration') {
    return mergeConfig(
      config,
      defineConfig({
        test: {
          fileParallelism: false,
          include: ['./test/**/*.integration.test.ts'],
          sequence: {
            hooks: 'list',
          },
          globalSetup: ['./test/setup-integration.ts'],
        },
      } satisfies ViteUserConfig),
    );
  }
  return {};
});
