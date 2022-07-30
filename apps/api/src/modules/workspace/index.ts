import {
  WorkspaceItem,
  SnippetEditorOptions,
  SnippetTerminal,
  SnippetFrame,
  SnippetEditorTab,
} from '@codeimage/prisma-models';
import fp from 'fastify-plugin';

interface WorkspaceHandler {
  findAllByUserId(id: string): Promise<WorkspaceItem[]>;
  deleteById(id: string): Promise<WorkspaceItem>;
  create(data: WorkspaceRequest, userId: string): Promise<WorkspaceItem>;
  updateById(data: WorkspaceItem): Promise<WorkspaceItem>;
}
type IdAndSnippetId = 'id' | 'snippetId';
interface WorkspaceRequest {
  name: WorkspaceItem['name'];
  editorOptions: Omit<SnippetEditorOptions, IdAndSnippetId>;
  terminal: Omit<SnippetTerminal, IdAndSnippetId>;
  frame: Omit<SnippetFrame, IdAndSnippetId>;
  editors: Omit<SnippetEditorTab, IdAndSnippetId>[];
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

    deleteById(id: string): Promise<WorkspaceItem> {
      return fastify.prisma.workspaceItem.delete({
        where: {
          id,
        },
      });
    },
    create(data: WorkspaceRequest, userId: string): Promise<WorkspaceItem> {
      // const dati = fastify.prisma.workspaceItem.create({
      //   data,
      // });
      return fastify.prisma.workspaceItem.create({
        data: {
          name: data.name,
          userId: userId,
          snippet: {
            create: {
              editorOptions: {
                create: data.editorOptions,
              },
              terminal: {
                create: data.terminal,
              },
              editorTabs: {
                create: data.editors,
              },
              snippetFrame: {
                create: data.frame,
              },
            },
          },
        },
        include: {
          snippet: true,
        },
      });
    },
    updateById(data: WorkspaceItem): Promise<WorkspaceItem> {
      return fastify.prisma.workspaceItem.update({
        where: {
          id: data.id,
        },
        data,
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
