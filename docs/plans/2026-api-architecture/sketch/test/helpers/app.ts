/**
 * Boots the real app for integration tests. Replaces test/helper.ts; test/helpers/ is the one
 * test-support folder (test/__internal__/ folds in here too).
 *
 * Integration tests assert HTTP responses and database state, not spies on decorators: the decorators
 * they used to spy on (presetService, presetRepository, projectRepository) no longer exist, and a
 * spy pins the implementation instead of the behavior.
 *
 * test/helpers/auth0Mock.ts stays as is (constraint 4); `build` calls the same mockAuthProvider it wraps.
 */
import type {User} from '@codeimage/prisma-models';
import type {FastifyInstance, FastifyPluginAsync} from 'fastify';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import type {TestContext} from 'vitest';
import App, {options} from '../../src/app.js';
import type {Config} from '../../src/config.js';
import {mockAuthProvider} from '../../src/plugins/auth0.js';

export interface BuildOptions {
  /** Config that wins over .env.test, e.g. `{PRESETS_LIMIT: 1}`. */
  readonly config?: Partial<Config>;
  /**
   * Who the requests come from. Default: the test context's seeded user (today's behavior).
   * `null`: no session at all, for 401 and anonymous-read tests.
   */
  readonly as?: User | null;
}

export async function build(
  t: TestContext & {user?: User},
  {config, as = t.user ?? null}: BuildOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({...options, logger: false});
  const authProvider: FastifyPluginAsync =
    as === null ? noSession() : mockAuthProvider(as);
  // fastify-plugin exposes the app's decorators to the test, as today.
  await app.register(fp(App), {authProvider, config});
  await app.ready();
  t.onTestFinished(() => app.close());
  return app;
}

/** An auth provider whose `authenticate` always rejects, as fastify-auth0-verify does without a token. */
function noSession(): FastifyPluginAsync {
  return fp(async fastify => {
    fastify.decorateRequest('user', null!);
    fastify.decorate('authenticate', async () => {
      throw new Error('no session');
    });
  });
}
