import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.delete(
    '/credentials',
    {
      schema: {
        params: Type.Object({
          credentialId: Type.String(),
        }),
      },
      preValidation: function (request, reply, done) {
        return fastify
          .auth([fastify.authenticate, fastify.verifyHankoPasskey])
          .apply(this, [request, reply, done]);
      },
    },
    async request => {
      return fastify.passkeysApi.credential(request.params.credentialId);
    },
  );
};

export default route;
