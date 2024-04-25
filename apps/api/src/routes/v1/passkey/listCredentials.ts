import {FastifyPluginAsyncTypebox, Type} from '@fastify/type-provider-typebox';
import {FastifySchema} from 'fastify';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';

const schema = {
  response: {
    200: Type.Array(
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        aaguid: Type.String(),
        attestation_type: Type.String(),
        created_at: Type.String({format: 'date-time'}),
        last_used_at: Type.String({format: 'date-time'}),
        public_key: Type.String(),
      }),
    ),
  },
} satisfies FastifySchema;

export type PasskeyListCredentialsApi = GetApiTypes<typeof schema>;

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.get('/credentials', {schema}, async request => {
    const user = request.appUser;
    return fetch(
      `https://passkeys.hanko.io/${fastify.config.HANKO_PASSKEYS_TENANT_ID}/credentials?user_id=${user.id}`,
      {
        headers: {
          apikey: fastify.config.HANKO_PASSKEYS_API_KEY,
        },
      },
    ).then(s => s.json());
  });
};

export default route;
