import {WorkspaceItem} from '@codeimage/prisma-models';
import fp from 'fastify-plugin';

interface WorkspaceHandler {
  findAllByUserId(id: string): Promise<WorkspaceItem[]>;
}

export default fp(async fastify => {
  const handler: WorkspaceHandler = {
    findAllByUserId(id: string): Promise<WorkspaceItem[]> {
      return fastify.prisma.workspaceItem.findMany({
        where: {
          userId: id,
        },
      });
    },
  };

  fastify.decorate('workspace', handler);
});

declare module 'fastify' {
  interface FastifyInstance {
    workspace: WorkspaceHandler;
  }
}
