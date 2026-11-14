import {parseTabMarks} from '../../../../schemas/marks.js';
import type {
  PrismaClient,
  Project,
  SnippetEditorTab,
} from '@codeimage/prisma-models';
import {
  type PartialProjectGetByIdResponse,
  type ProjectCreateRequest,
  type ProjectCreateResponse,
  type ProjectGetByIdResponse,
  type ProjectUpdateRequest,
  type ProjectUpdateResponse,
} from '../../domain/index.js';
import type {ProjectRepository} from '../../repository/index.js';

function mapProjectMarks<T extends {editorTabs: SnippetEditorTab[]}>(
  project: T,
) {
  return {
    ...project,
    editorTabs: project.editorTabs.map(tab => ({
      ...tab,
      marks: parseTabMarks(tab.marks),
    })),
  };
}

export function makePrismaProjectRepository(
  client: PrismaClient,
): ProjectRepository {
  async function findById(id: string): Promise<ProjectGetByIdResponse | null> {
    const project = await client.project.findFirst({
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
    return project ? mapProjectMarks(project) : null;
  }

  function findAllByUserId(
    ownerId: string,
  ): Promise<PartialProjectGetByIdResponse[]> {
    return client.project.findMany({
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

  function deleteProject(id: string, ownerId: string): Promise<Project> {
    return client.project.delete({
      where: {
        id_ownerId: {
          id,
          ownerId,
        },
      },
    });
  }

  async function createNewProject(
    ownerId: string,
    data: ProjectCreateRequest,
  ): Promise<ProjectCreateResponse> {
    const project = await client.project.create({
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
            borderType: data.terminal.borderType,
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
    return mapProjectMarks(project);
  }

  async function updateProject(
    userId: string,
    projectId: string,
    data: ProjectUpdateRequest,
  ): Promise<ProjectUpdateResponse> {
    const project = await client.project.update({
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
            const {languageId, code, tabName, lineNumberStart, id} = editor;
            const marks = editor.marks ?? {lines: [], focusedLines: []};
            return {
              where: {
                id,
              },
              create: {
                code,
                tabName,
                languageId,
                lineNumberStart,
                marks,
              },
              update: {
                code,
                tabName,
                languageId,
                lineNumberStart,
                marks,
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
            enableLigatures: data.editorOptions.enableLigatures,
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
            borderType: data.terminal.borderType,
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
    return mapProjectMarks(project);
  }

  async function updateProjectName(projectId: string, name: string) {
    return client.project.update({
      data: {
        name,
      },
      where: {
        id: projectId,
      },
    });
  }

  return {
    findById,
    updateProjectName,
    findAllByUserId,
    createNewProject,
    updateProject,
    deleteProject,
  };
}
