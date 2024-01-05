import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {FastifySchema} from 'fastify';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';

const schema = {
  params: Type.Object({
    credentialId: Type.String(),
  }),
  body: Type.Object({
    name: Type.String(),
  }),
  response: {
    200: Type.Null(),
  },
} satisfies FastifySchema;

export type PasskeyUpdateCredentialsApi = GetApiTypes<typeof schema>;

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.patch('/credentials/:credentialId', {schema}, async request => {
    const {appUser, params, body} = request;
    const userCredentials = await fastify.passkeysApi
      .user(appUser.id)
      .credentials();

    console.log('user credentials', userCredentials, params.credentialId);
    console.info('updating with', body);
    if (
      !userCredentials.find(credential => credential.id === params.credentialId)
    ) {
      throw fastify.httpErrors.badRequest();
    }
    console.log('data', JSON.stringify(body));
    return fetch(
      `https://passkeys.hanko.io/${fastify.config.HANKO_PASSKEYS_TENANT_ID}/credentials/${request.params.credentialId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: fastify.config.HANKO_PASSKEYS_API_KEY,
        },
        body: JSON.stringify(body),
      },
    );
  });
};

export default route;
