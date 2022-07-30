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

export interface WorkspaceRequest {
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
    async create(
      data: WorkspaceRequest,
      userId: string,
    ): Promise<WorkspaceItem> {
      const workspaceItem = await fastify.prisma.workspaceItem.create({
        data: {
          name: 'Untitled',
          userId,
          snippet: {create: {}},
        },
        include: {
          snippet: true,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // @ts-ignore
      const editorOptions = await fastify.prisma.snippetEditorOptions.create({
        data: {
          ...data.editorOptions,
          snippetId: workspaceItem.snippet!.id,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // @ts-ignore
      const editorsTab = await fastify.prisma.snippetEditorTab.createMany({
        data: [
          ...data.editors.map(editor => ({
            snippetId: workspaceItem.snippet!.id,
            ...editor,
          })),
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // @ts-ignore
      const a = await fastify.prisma.snippetTerminal.create({
        data: {
          ...data.terminal,
          snippetId: workspaceItem.snippet!.id,
        },
      });

      return {
        ...workspaceItem,
      };
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
