import {PrismaClient} from '@codeimage/prisma-models';
import {ProjectCreateRequest, ProjectUpdateRequest} from '../domain';

export class ProjectRepository {
  constructor(private readonly client: PrismaClient) {}

  findById(id: string) {
    return this.client.project.findFirst({
      where: {
        id,
      },
      include: {
        editorTabs: true,
        terminal: true,
        editorOptions: true,
        frame: true,
      },
    });
  }

  findAllByUserId(ownerId: string) {
    return this.client.project.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        editorOptions: false,
        terminal: false,
        editorTabs: {
          select: {
            languageId: true,
            tabName: true,
          },
        },
        frame: false,
      },
    });
  }

  deleteProject(id: string, ownerId: string) {
    return this.client.project.delete({
      where: {
        id_ownerId: {
          id,
          ownerId,
        },
      },
    });
  }

  createNewProject(ownerId: string, data: ProjectCreateRequest) {
    return this.client.project.create({
      data: {
        name: data.name,
        owner: {
          connect: {id: ownerId},
        },
        editorTabs: {
          createMany: {
            data: data.editors,
          },
        },
        editorOptions: {
          create: {
            fontId: data.editorOptions.fontId,
            fontWeight: data.editorOptions.fontWeight,
            showLineNumbers: data.editorOptions.showLineNumbers,
            themeId: data.editorOptions.themeId,
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

  async updateProject(
    userId: string,
    projectId: string,
    data: ProjectUpdateRequest,
  ) {
    return this.client.project.update({
      where: {
        id: projectId,
      },
      data: {
        // Update automatically the `updatedAt` field
        id: projectId,
        editorTabs: {
          deleteMany: {
            NOT: {
              id: {
                in: data.editors.map(({id}) => id),
              },
            },
          },
          upsert: data.editors.map(editor => {
            const {languageId, code, tabName} = editor;
            return {
              where: {
                id: editor.id,
              },
              create: {
                code,
                tabName,
                languageId,
              },
              update: {
                code,
                tabName,
                languageId,
              },
            };
          }),
        },
        editorOptions: {
          update: {
            fontId: data.editorOptions.fontId,
            fontWeight: data.editorOptions.fontWeight,
            showLineNumbers: data.editorOptions.showLineNumbers,
            themeId: data.editorOptions.themeId,
          },
        },
        frame: {
          update: {
            background: data.frame.background,
            opacity: data.frame.opacity,
            radius: data.frame.radius,
            padding: data.frame.padding,
            visible: data.frame.visible,
          },
        },
        terminal: {
          update: {
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

  async updateProjectName(projectId: string, name: string) {
    return this.client.project.update({
      data: {
        name,
      },
      where: {
        id: projectId,
      },
    });
  }
}
