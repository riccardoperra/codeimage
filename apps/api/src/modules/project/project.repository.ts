import type * as repository from './project.repository.js';
import type {
  Project as ProjectRow,
  SnippetEditorOptions as EditorOptionsRow,
  SnippetEditorTab as EditorTabRow,
  SnippetFrame as FrameRow,
  SnippetTerminal as TerminalRow,
} from '@codeimage/prisma-models';
import {type Db, type OwnerScope, orNull} from '../../shared/db.js';
import {asUserId, type UserId} from '../../shared/principal.js';
import type {
  Project,
  ProjectChanges,
  ProjectDraft,
  ProjectHeader,
  ProjectSummary,
} from './project.model.js';

const fullProject = {
  frame: true,
  terminal: true,
  editorOptions: true,
  editorTabs: true,
} as const;

export async function findProjectById(
  db: Db,
  id: string,
): Promise<Project | null> {
  const row = await db.project.findFirst({
    where: {id},
    include: fullProject,
  });
  return row ? toProject(row) : null;
}

export async function listProjects(
  scope: OwnerScope,
): Promise<ProjectSummary[]> {
  const rows = await scope.client.project.findMany({
    where: {ownerId: scope.ownerId},
    orderBy: {updatedAt: 'desc'},
    include: {editorTabs: {select: {languageId: true, tabName: true}}},
  });
  return rows.map(row => ({
    ...toHeader(row),
    frameId: row.frameId,
    terminalId: row.terminalId,
    editorOptionsId: row.editorOptionsId,
    editorTabs: row.editorTabs,
  }));
}

export async function createProject(
  scope: OwnerScope,
  draft: ProjectDraft,
): Promise<Project> {
  const row = await scope.client.project.create({
    data: {
      name: draft.name,
      owner: {
        connect: {id: scope.ownerId},
      },
      editorTabs: {
        createMany: {
          data: [...draft.editorTabs],
        },
      },
      editorOptions: {
        create: {
          fontId: draft.editorOptions.fontId,
          fontWeight: draft.editorOptions.fontWeight,
          showLineNumbers: draft.editorOptions.showLineNumbers,
          themeId: draft.editorOptions.themeId,
        },
      },
      frame: {
        create: {
          background: draft.frame.background,
          opacity: draft.frame.opacity,
          radius: draft.frame.radius,
          padding: draft.frame.padding,
          visible: draft.frame.visible,
        },
      },
      terminal: {
        create: {
          accentVisible: draft.terminal.accentVisible,
          alternativeTheme: draft.terminal.alternativeTheme,
          background: draft.terminal.background,
          opacity: draft.terminal.opacity,
          shadow: draft.terminal.shadow,
          showGlassReflection: draft.terminal.showGlassReflection,
          showHeader: draft.terminal.showHeader,
          showWatermark: draft.terminal.showWatermark,
          textColor: draft.terminal.textColor,
          type: draft.terminal.type,
          borderType: draft.terminal.borderType,
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
  return toProject(row);
}

export async function updateProject(
  scope: OwnerScope,
  id: string,
  changes: ProjectChanges,
): Promise<Project | null> {
  const row = await orNull(
    scope.client.project.update({
      where: {id_ownerId: {id, ownerId: scope.ownerId}},
      data: {
        id,
        editorTabs: {
          deleteMany: {
            NOT: {id: {in: changes.editorTabs.map(tab => tab.id)}},
          },
          upsert: changes.editorTabs.map(
            ({id, code, tabName, languageId, lineNumberStart}) => ({
              where: {id},
              create: {code, tabName, languageId, lineNumberStart},
              update: {code, tabName, languageId, lineNumberStart},
            }),
          ),
        },
        editorOptions: {
          update: {
            fontId: changes.editorOptions.fontId,
            fontWeight: changes.editorOptions.fontWeight,
            showLineNumbers: changes.editorOptions.showLineNumbers,
            themeId: changes.editorOptions.themeId,
            enableLigatures: changes.editorOptions.enableLigatures,
          },
        },
        frame: {
          update: {
            background: changes.frame.background,
            opacity: changes.frame.opacity,
            radius: changes.frame.radius,
            padding: changes.frame.padding,
            visible: changes.frame.visible,
          },
        },
        terminal: {
          update: {
            accentVisible: changes.terminal.accentVisible,
            alternativeTheme: changes.terminal.alternativeTheme,
            background: changes.terminal.background,
            opacity: changes.terminal.opacity,
            shadow: changes.terminal.shadow,
            showGlassReflection: changes.terminal.showGlassReflection,
            showHeader: changes.terminal.showHeader,
            showWatermark: changes.terminal.showWatermark,
            textColor: changes.terminal.textColor,
            type: changes.terminal.type,
            borderType: changes.terminal.borderType,
          },
        },
      },
      include: fullProject,
    }),
  );
  return row ? toProject(row) : null;
}

export async function renameProject(
  scope: OwnerScope,
  id: string,
  name: string,
): Promise<ProjectHeader | null> {
  const row = await orNull(
    scope.client.project.update({
      where: {id_ownerId: {id, ownerId: scope.ownerId}},
      data: {name},
    }),
  );
  return row ? toHeader(row) : null;
}

export async function removeProject(
  scope: OwnerScope,
  id: string,
): Promise<ProjectHeader | null> {
  const row = await orNull(
    scope.client.project.delete({
      where: {id_ownerId: {id, ownerId: scope.ownerId}},
    }),
  );
  return row ? toHeader(row) : null;
}

export type ProjectRepository = Pick<
  typeof repository,
  | 'listProjects'
  | 'createProject'
  | 'updateProject'
  | 'renameProject'
  | 'removeProject'
>;

export interface ProjectDependencies {
  readonly projects: ProjectRepository;
  readonly scopeFor: (userId: UserId) => OwnerScope;
  readonly findProject: (id: string) => Promise<Project | null>;
}

function toHeader(row: ProjectRow): ProjectHeader {
  return {
    id: row.id,
    ownerId: asUserId(row.ownerId),
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toProject(
  row: ProjectRow & {
    frame: FrameRow;
    terminal: TerminalRow;
    editorOptions: EditorOptionsRow;
    editorTabs: EditorTabRow[];
  },
): Project {
  return {
    ...toHeader(row),
    frame: {
      id: row.frame.id,
      background: row.frame.background,
      padding: row.frame.padding,
      radius: row.frame.radius,
      visible: row.frame.visible,
      opacity: row.frame.opacity,
    },
    terminal: {
      id: row.terminal.id,
      type: row.terminal.type,
      showHeader: row.terminal.showHeader,
      accentVisible: row.terminal.accentVisible,
      shadow: row.terminal.shadow,
      background: row.terminal.background,
      textColor: row.terminal.textColor,
      showWatermark: row.terminal.showWatermark,
      showGlassReflection: row.terminal.showGlassReflection,
      opacity: row.terminal.opacity,
      alternativeTheme: row.terminal.alternativeTheme,
      borderType: row.terminal.borderType,
    },
    editorOptions: {
      id: row.editorOptions.id,
      fontId: row.editorOptions.fontId,
      fontWeight: row.editorOptions.fontWeight,
      showLineNumbers: row.editorOptions.showLineNumbers,
      themeId: row.editorOptions.themeId,
      enableLigatures: row.editorOptions.enableLigatures,
    },
    editorTabs: row.editorTabs.map(tab => ({
      id: tab.id,
      projectId: tab.projectId,
      code: tab.code,
      languageId: tab.languageId,
      tabName: tab.tabName,
      lineNumberStart: tab.lineNumberStart,
    })),
  };
}
