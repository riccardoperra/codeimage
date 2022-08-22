import {Project} from '@codeimage/prisma-models';
import {FastifyPluginAsync} from 'fastify';

const getAllByUserIdRoute: FastifyPluginAsync = async fastify => {
  fastify.get(
    '/',
    {
      preValidation: (req, reply) => fastify.authorize(req, reply),
      schema: {
        tags: ['Project'],
      },
    },
    async (request): Promise<Project[]> => {
      const {appUser} = request;
      return fastify.projectService.findAllByUserId(appUser.id);
    },
  );
};

export default getAllByUserIdRoute;
