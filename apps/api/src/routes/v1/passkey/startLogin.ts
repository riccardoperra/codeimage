import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {FastifySchema} from 'fastify';
import {Nullable} from '../../../common/typebox/nullable.js';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';

const schema = {
  tags: ['Passkey'],
  summary: 'Initialize a login flow for passkeys',
  response: {
    200: Type.Object({
      publicKey: Type.Object({
        challenge: Type.String(),
        timeout: Nullable(Type.Number()),
        rpId: Nullable(Type.String()),
        allowCredentials: Nullable(Type.Array(Type.String())),
        userVerification: Nullable(Type.String()),
        extensions: Nullable(Type.Object({}, {additionalProperties: true})),
      }),
    }),
  },
} satisfies FastifySchema;

export type PasskeyStartLoginApi = GetApiTypes<typeof schema>;

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.post(
    '/start-login',
    {
      schema,
    },
    async () => {
      return fastify.passkeysApi.login.initialize();
    },
  );
};

export default route;
