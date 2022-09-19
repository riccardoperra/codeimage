import {FastifyPluginAsync} from 'fastify';
import {ProjectGetByIdResponse} from '../../../modules/project/schema';

const getAllByUserIdRoute: FastifyPluginAsync = async fastify => {
  fastify.get(
    '/',
    {
      preValidation: (req, reply) => fastify.authorize(req, reply),
      schema: {
        tags: ['Project'],
        description: 'Get all CodeImage projects by the current user',
      },
    },
    async (request): Promise<ProjectGetByIdResponse[]> => {
      const {appUser} = request;
      return fastify.projectService.findAllByUserId(appUser.id);
    },
  );
};

export default getAllByUserIdRoute;
