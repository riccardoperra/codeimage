import {WorkspaceItem} from '@codeimage/prisma-models';
import {FastifyPluginAsync} from 'fastify';

const workspace: FastifyPluginAsync = async fastify => {
  fastify.get(
    '/workspace',
    {preHandler: fastify.authorize},
    async (request): Promise<WorkspaceItem[]> => {
      const {userId} = request;
      return fastify.workspace.findAllByUserId(userId);
    },
  );
};

export default workspace;
