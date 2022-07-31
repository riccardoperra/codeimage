import {FastifyPluginAsync, FastifySchema} from 'fastify';
import {ProjectCreateRequest} from '../../../modules/workspace';

const schema: FastifySchema = {
  tags: ['Workspace'],
  description: 'Create a new CodeImage project',
  body: {
    $ref: 'projectCreateRequest',
  },
  response: {
    200: {
      $ref: 'projectCreateResponse',
    },
  },
};

const createRoute: FastifyPluginAsync = async fastify => {
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
