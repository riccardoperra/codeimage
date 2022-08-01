import {Project} from '@codeimage/prisma-models';
import {FastifyPluginAsync} from 'fastify';

const getAllByUserIdRoute: FastifyPluginAsync = async fastify => {
  fastify.get(
    '/',
    {
      preHandler: fastify.authorize,
      schema: {
        tags: ['Project'],
      },
    },
    async (request): Promise<Project[]> => {
      const {userId} = request;
      return fastify.projectRepository.findAllByUserId(userId);
    },
  );
};

export default getAllByUserIdRoute;
