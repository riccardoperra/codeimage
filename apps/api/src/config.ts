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
    description:
      'Namespace of the custom email claim: `${AUTH0_CLIENT_CLAIMS}/email`.',
  }),
  CLIENT_SECRET_AUTH: Type.Optional(Type.String()),
  ALLOWED_ORIGINS: Type.String({
    description: 'Comma list; `*` allows any origin; empty disables CORS.',
  }),
  PRESETS_LIMIT: Type.Number({
    default: Number.MAX_SAFE_INTEGER,
    description:
      'Presets per account. 0 disables the check. See preset.model.ts exceedsPresetLimit.',
  }),
});

export type Config = Static<typeof ConfigSchema>;

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
  }
}

export interface ConfigPluginOptions {
  readonly overrides?: Partial<Config>;
}

export default fp<ConfigPluginOptions>(
  async (fastify, {overrides}) => {
    await fastify.register(fastifyEnv, {
      schema: ConfigSchema,
      dotenv: true,
      data: {...process.env, ...overrides},
    });
  },
  {name: 'config'},
);
