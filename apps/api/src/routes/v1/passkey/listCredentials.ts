import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.get('/credentials', {}, async () => {
    return fetch(
      `https://passkeys.hanko.io/${fastify.config.HANKO_PASSKEYS_TENANT_ID}/credentials?user_id=4676fe25-3660-4c0d-b89e-34b177e759f0`,
      {
        headers: {
          apikey: fastify.config.HANKO_PASSKEYS_API_KEY,
        },
      },
    )
      .then(s => s.json())
      .then(s => {
        console.log(s);
        return s;
      });
  });
};

export default route;
