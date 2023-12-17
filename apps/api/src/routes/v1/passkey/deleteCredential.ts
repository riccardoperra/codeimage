import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.delete(
    '/credentials',
    {
      schema: {
        params: Type.Object({
          credentialId: Type.String(),
        }),
      },
    },
    async request => {
      return fastify.passkeysApi.credential(request.params.credentialId);
    },
  );
};

export default route;
