import {FastifyPluginAsync} from 'fastify';
import {ProjectGetByIdResponse} from '../../../modules/project/schema/index.js';

const getAllByUserIdRoute: FastifyPluginAsync = async fastify => {
  fastify.get(
    '/',
    {
      preValidation: fastify.authorize({mustBeAuthenticated: true}),
      schema: {
        tags: ['Project'],
        summary: 'Get all CodeImage projects by the current user',
      },
    },
    async (request): Promise<ProjectGetByIdResponse[]> => {
      const {appUser} = request;
      return fastify.projectService.findAllByUserId(appUser.id);
    },
  );
};

export default getAllByUserIdRoute;
