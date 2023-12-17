import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.get('/info', {}, async request => {
    const response = await fastify.auth0Management.usersByEmail.getByEmail({
      email: request.appUser.email,
      fields: 'user_id,email,created_at,email_verified,picture',
    });
    return {...response.data[0], id: request.appUser.id};
  });
};

export default route;
