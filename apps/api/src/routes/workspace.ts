import {Project} from '@codeimage/prisma-models';
import {FastifyPluginAsync} from 'fastify';
import {ProjectCreateRequest} from '../modules/workspace';
import {
  workspaceCreateRequestSchema,
  workspaceCreateResponseSchema,
} from '../modules/workspace/workspace.schema';

const workspace: FastifyPluginAsync = async fastify => {
  fastify.get(
    '/workspace',
    {preHandler: fastify.authorize},
    async (request): Promise<Project[]> => {
      const {userId} = request;
      return fastify.workspace.findAllByUserId(userId);
    },
  );

  fastify.post<{
    Body: ProjectCreateRequest;
  }>(
    '/workspace',
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
    async (request): Promise<Project> => {
      const {userId, body} = request;
      return fastify.workspace.create(body, userId);
    },
  );

  fastify.delete<{
    Params: {id: string};
  }>(
    '/workspace/:id',
    {
      preHandler: fastify.authorize,
      schema: {
        tags: ['Workspace'],
      },
    },
    async request => {
      const {
        userId,
        params: {id},
      } = request;
      return fastify.workspace.deleteById(id, userId);
    },
  );
};

export default workspace;
