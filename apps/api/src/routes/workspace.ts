import {WorkspaceItem} from '@codeimage/prisma-models';
import {FastifyPluginAsync} from 'fastify';
import {WorkspaceCreateRequest} from '../modules/workspace';
import {
  workspaceCreateRequestSchema,
  workspaceCreateResponseSchema,
} from '../modules/workspace/workspace.schema';

const workspace: FastifyPluginAsync = async fastify => {
  fastify.get(
    '/workspace',
    {preHandler: fastify.authorize},
    async (request): Promise<WorkspaceItem[]> => {
      const {userId} = request;
      return fastify.workspace.findAllByUserId(userId);
    },
  );

  fastify.post<{
    Body: WorkspaceCreateRequest;
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
    async (request): Promise<WorkspaceItem> => {
      const {userId, body} = request;
      return fastify.workspace.create(body, userId);
    },
  );
};

export default workspace;
