import {FastifyPluginAsync} from 'fastify';
import {GetApiTypes} from '../../../common/types/extract-api-types';
import {
  ProjectCreateRequest,
  ProjectCreateRequestSchema,
  ProjectCreateResponseSchema,
} from '../../../modules/project/schema';

const schema = {
  tags: ['Project'],
  description: 'Create a new CodeImage project',
  body: ProjectCreateRequestSchema,
  response: {
    200: ProjectCreateResponseSchema,
  },
};

export type CreateProjectApi = GetApiTypes<typeof schema>;

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
