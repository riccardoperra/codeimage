import {FastifyPluginAsync, FastifySchema} from 'fastify';
import {
  ProjectCreateRequest,
  ProjectCreateRequestSchema,
  ProjectCreateResponseSchema,
} from '../../../modules/project/schema';

const createRoute: FastifyPluginAsync = async fastify => {
  const schema: FastifySchema = {
    tags: ['Project'],
    description: 'Create a new CodeImage project',
    body: ProjectCreateRequestSchema,
    response: {
      200: ProjectCreateResponseSchema,
    },
  };

  fastify.post<{
    Body: ProjectCreateRequest;
  }>(
    '/',
    {
      preHandler: fastify.authorize,
      schema,
    },
    async request => {
      const {userId, body} = request;
      // TODO: move to service
      const response = fastify.projectRepository.createNewProject(userId, body);
      return response;
    },
  );
};

export default createRoute;
