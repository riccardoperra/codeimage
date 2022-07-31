import {FastifyPluginAsync} from 'fastify';
import {ProjectCreateRequest} from '../../../modules/workspace';
import {
  workspaceCreateRequestSchema,
  workspaceCreateResponseSchema,
} from '../../../modules/workspace/workspace.schema';

const createRoute: FastifyPluginAsync = async fastify => {
  fastify.post<{
    Body: ProjectCreateRequest;
  }>(
    '/',
    {
      preHandler: fastify.authorize,
      schema: {
        tags: ['Workspace'],
        body: workspaceCreateRequestSchema,
        response: {
          200: workspaceCreateResponseSchema,
        },
      },
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
