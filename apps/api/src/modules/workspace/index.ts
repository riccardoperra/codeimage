import {
  Project,
  SnippetEditorOptions,
  SnippetEditorTab,
  SnippetFrame,
  SnippetTerminal,
} from '@codeimage/prisma-models';
import fp from 'fastify-plugin';

interface ProjectHandler {
  findAllByUserId(id: string): Promise<Project[]>;

  deleteById(id: string, userId: string): Promise<Project>;

  create(data: ProjectCreateRequest, userId: string): Promise<Project>;

  updateById(data: Project): Promise<Project>;
}

type IdAndSnippetId = 'id' | 'snippetId';

export interface ProjectCreateRequest {
  name: Project['name'];
  editorOptions: Omit<SnippetEditorOptions, IdAndSnippetId>;
  terminal: Omit<SnippetTerminal, IdAndSnippetId>;
  frame: Omit<SnippetFrame, IdAndSnippetId>;
  editors: Omit<SnippetEditorTab, IdAndSnippetId>[];
}

export default fp(async fastify => {
  const handler: ProjectHandler = {
    findAllByUserId(id: string): Promise<Project[]> {
      return fastify.prisma.project.findMany({
        where: {
          userId: id,
        },
      });
    },

    deleteById(id: string, userId: string): Promise<Project> {
      return fastify.prisma.project.delete({
        where: {
          id_userId: {
            id,
            userId,
          },
        },
      });
    },

    create(data: ProjectCreateRequest, userId: string) {
      return fastify.prisma.project.create({
        // @ts-ignore
        data: {
          name: 'Untitled',
          userId,
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
          frame: {
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
        include: {
          editorOptions: true,
          editorTabs: true,
          frame: true,
          terminal: true,
        },
      });
    },

    updateById(data: Project): Promise<Project> {
      return fastify.prisma.project.update({
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
    workspace: ProjectHandler;
  }
}
