import * as path from 'path';
import {defineConfig, mergeConfig, UserConfig} from 'vitest/config';

export default defineConfig(() => {
  const testType = process.env.RUN_TEST ?? 'unit';

  const config = {
    test: {
      deps: {
        inline: ['@fastify/autoload'],
      },
    },
    resolve: {
      alias: {
        '@api/domain': path.resolve(
          'src/common/domainFunctions/functions.d.ts',
        ),
      },
    },
  } satisfies UserConfig;

  if (testType === 'unit') {
    return mergeConfig(config, {
      test: {
        exclude: ['./test/**/*.integration.test.ts'],
        include: ['./test/**/*.test.ts'],
        globalSetup: ['./test/setup-job-unit.ts'],
      },
    });
  } else if (testType === 'integration') {
    return mergeConfig(config, {
      test: {
        include: ['./test/**/*.integration.test.ts'],
        threads: false,
        sequence: {
          hooks: 'list',
        },
        globalSetup: ['./test/setup-job-integration.ts'],
      },
    } satisfies UserConfig);
  }
  return {};
});
