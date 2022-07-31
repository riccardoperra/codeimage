import {PrismaClient, Project} from '@codeimage/prisma-models';
import {ProjectCreateRequest, ProjectCreateResponse} from '../../domain';
import {ProjectRepository} from '../../repository';

export function makePrismaProjectRepository(
  client: PrismaClient,
): ProjectRepository {
  function findAllByUserId(userId: string): Promise<Project[]> {
    return client.project.findMany({
      where: {
        userId,
      },
      include: {
        editorOptions: true,
        terminal: true,
        editorTabs: true,
        frame: true,
      },
    });
  }

  function deleteProject(id: string, userId: string): Promise<Project> {
    return client.project.delete({
      where: {
        id_userId: {
          id,
          userId,
        },
      },
    });
  }

  function createNewProject(
    userId: string,
    data: ProjectCreateRequest,
  ): Promise<ProjectCreateResponse> {
    return client.project.create({
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
  }

  return {
    findAllByUserId,
    createNewProject,
    deleteProject,
  };
}
