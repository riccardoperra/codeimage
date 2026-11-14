/**
 * Environment configuration: one TypeBox schema, the type derived from it, decorated as `fastify.config`.
 * Replaces the hand-written `FastifyInstance['config']` interface in today's app.ts, which drifted from
 * the schema (MOCK_AUTH_EMAIL and CLIENT_SECRET_AUTH typed but never validated; CLIENT_ID_AUTH0,
 * CLIENT_SECRET_AUTH0 and GRANT_TYPE_AUTH0 required but never read).
 *
 * Registered explicitly by app.ts before anything else, because every plugin and module reads it.
 */
import fastifyEnv from '@fastify/env';
import type {Static} from '@sinclair/typebox';
import {Type} from '@sinclair/typebox';
import fp from 'fastify-plugin';

export const ConfigSchema = Type.Object({
  DATABASE_URL: Type.String(),
  MOCK_AUTH: Type.Boolean({
    default: false,
    description: 'Dev only: authenticate every request as MOCK_AUTH_EMAIL.',
  }),
  MOCK_AUTH_EMAIL: Type.Optional(Type.String()),
  DOMAIN_AUTH0: Type.String(),
  AUDIENCE_AUTH0: Type.String({pattern: '^https?:'}),
  AUTH0_CLIENT_CLAIMS: Type.String({
    pattern: '^https?:',
    description: 'Namespace of the custom email claim: `${AUTH0_CLIENT_CLAIMS}/email`.',
  }),
  /** Passed to fastify-auth0-verify as `secret` (today's actual key name, no 0). */
  CLIENT_SECRET_AUTH: Type.Optional(Type.String()),
  ALLOWED_ORIGINS: Type.String({
    description: 'Comma list; `*` allows any origin; empty disables CORS.',
  }),
  PRESETS_LIMIT: Type.Number({
    default: Number.MAX_SAFE_INTEGER,
    description: 'Presets per account. 0 disables the check. See preset.model.ts exceedsPresetLimit.',
  }),
});

export type Config = Static<typeof ConfigSchema>;

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
  }
}

export interface ConfigPluginOptions {
  /** Test seam: values that win over the environment, e.g. `{PRESETS_LIMIT: 1}`. */
  readonly overrides?: Partial<Config>;
}

export default fp<ConfigPluginOptions>(
  async (fastify, {overrides}) => {
    await fastify.register(fastifyEnv, {
      schema: ConfigSchema,
      dotenv: true,
      // TODO: env-schema loads .env into process.env, then validates `data`. Pass process.env merged
      // with `overrides` so overrides win; verify the merge order against the installed env-schema.
      data: {...process.env, ...overrides},
    });
    // TODO (open question Q7): refuse to boot with MOCK_AUTH=true when NODE_ENV === 'production'.
  },
  {name: 'config'},
);
