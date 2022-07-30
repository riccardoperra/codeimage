import {WorkspaceItem} from '@prisma/client';
import {FastifyPluginAsync} from 'fastify';

const workspace: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get(
    '/workspace',
    async (_request, _reply): Promise<WorkspaceItem[]> => {
      return fastify.prisma.workspaceItem.findMany({});
    },
  );
};

export default workspace;
