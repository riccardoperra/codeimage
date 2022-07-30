import {
  SnippetEditorOptions,
  SnippetEditorTab,
  SnippetFrame,
  SnippetTerminal,
  WorkspaceItem,
} from '@codeimage/prisma-models';
import fp from 'fastify-plugin';

interface WorkspaceHandler {
  findAllByUserId(id: string): Promise<WorkspaceItem[]>;

  deleteById(id: string): Promise<WorkspaceItem>;

  create(data: WorkspaceCreateRequest, userId: string): Promise<WorkspaceItem>;

  updateById(data: WorkspaceItem): Promise<WorkspaceItem>;
}

type IdAndSnippetId = 'id' | 'snippetId';

export interface WorkspaceCreateRequest {
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
    async create(data: WorkspaceCreateRequest, userId: string) {
      return fastify.prisma.workspaceItem.create({
        data: {
          name: 'Untitled',
          userId,
          snippet: {
            create: {
              editorOptions: {
                create: {
                  fontId: data.editorOptions.fontId,
                  fontWeight: data.editorOptions.fontWeight,
                  showLineNumbers: data.editorOptions.showLineNumbers,
                  themeId: data.editorOptions.themeId,
                },
              },
              editorTabs: {
                createMany: {
                  data: data.editors,
                },
              },
              snippetFrame: {
                create: {
                  background: data.frame.background,
                  opacity: data.frame.opacity,
                  radius: data.frame.radius,
                  padding: data.frame.padding,
                  visible: data.frame.visible,
                },
              },
              terminal: {
                create: {
                  accentVisible: data.terminal.accentVisible,
                  alternativeTheme: data.terminal.alternativeTheme,
                  background: data.terminal.background,
                  opacity: data.terminal.opacity,
                  shadow: data.terminal.shadow,
                  showGlassReflection: data.terminal.showGlassReflection,
                  showHeader: data.terminal.showHeader,
                  showWatermark: data.terminal.showWatermark,
                  textColor: data.terminal.textColor,
                  type: data.terminal.type,
                },
              },
            },
          },
        },
        include: {
          snippet: {
            include: {
              editorOptions: true,
              editorTabs: true,
              snippetFrame: true,
              terminal: true,
            },
          },
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
