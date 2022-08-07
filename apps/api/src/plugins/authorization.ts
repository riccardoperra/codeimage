import {FastifyPluginAsync, FastifyRequest} from 'fastify';
import fp from 'fastify-plugin';

interface AuthorizationHeaders {
  'user-id': string;
}

const authorization: FastifyPluginAsync = async fastify => {
  async function authorize(
    req: FastifyRequest<{Headers: AuthorizationHeaders}>,
  ) {
    const userId = req.headers['user-id'];

    // TODO: Remove fake auth
    const user = await fastify.prisma.user.findFirst({where: {id: userId}});
    if (!user) {
      await fastify.prisma.user.create({
        data: {provider: 'github', id: userId},
      });
    }
    req.userId = userId;
    return userId;
  }

  fastify.decorate('authorize', authorize);
  fastify.decorateRequest('userId', null);
};

export default fp(authorization, {name: 'codeimage-authorization'});

declare module 'fastify' {
  interface FastifyInstance {
    authorize: (req: FastifyRequest) => string;
  }

  interface FastifyRequest {
    userId: string;
  }
}
