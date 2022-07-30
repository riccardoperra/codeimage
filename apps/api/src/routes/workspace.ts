import {WorkspaceItem} from '@codeimage/prisma-models';
import {FastifyPluginAsync} from 'fastify';
import {WorkspaceRequest} from '../modules/workspace';

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
    Body: WorkspaceRequest;
  }>(
    '/workspace',
    {preHandler: fastify.authorize},
    async (request): Promise<WorkspaceItem> => {
      const {userId} = request;

      return fastify.workspace.create(request.body, userId);
    },
  );
};

export default workspace;
