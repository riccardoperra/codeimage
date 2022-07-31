import {PrismaClient, Project} from '@codeimage/prisma-models';
import {ProjectCreateRequest, ProjectCreateResponse} from '../../domain';
import {ProjectRepository} from '../../repository';

export function makePrismaProjectRepository(
  prisma: PrismaClient,
): ProjectRepository {
  return {
    async deleteProject(id: string, userId: string): Promise<Project> {
      return prisma.project.delete({
        where: {
          id_userId: {
            id,
            userId,
          },
        },
      });
    },

    async createNewProject(
      userId: string,
      data: ProjectCreateRequest,
    ): Promise<ProjectCreateResponse> {
      return prisma.project.create({
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
  };
}
