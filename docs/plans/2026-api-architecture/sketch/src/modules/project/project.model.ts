/**
 * The project domain: types, pure rules, errors. No I/O, no Fastify, no Prisma.
 * Replaces modules/project/domain/* (Prisma Pick/Omit aliases) and mapper/create-project-mapper.ts.
 */
import {defineErrors} from '../../shared/errors.js';
import {isOwnedBy, type Principal, type UserId} from '../../shared/principal.js';
import {
  EditorOptionsCreateRequestSchema,
  type ProjectCreateBody,
  type ProjectUpdateBody,
  SnippetFrameCreateRequestSchema,
  SnippetTerminalCreateRequestSchema,
} from './project.contract.js';

export interface SnippetFrame {
  readonly id: string;
  readonly background: string | null;
  readonly padding: number;
  readonly radius: number | null;
  readonly visible: boolean;
  readonly opacity: number;
}

export interface SnippetTerminal {
  readonly id: string;
  readonly showHeader: boolean;
  readonly type: string;
  readonly accentVisible: boolean;
  readonly shadow: string | null;
  readonly background: string | null;
  readonly textColor: string | null;
  readonly showWatermark: boolean;
  readonly showGlassReflection: boolean;
  readonly opacity: number;
  readonly alternativeTheme: boolean;
  readonly borderType: string | null;
}

export interface SnippetEditorOptions {
  readonly id: string;
  readonly fontId: string;
  readonly fontWeight: number;
  readonly showLineNumbers: boolean;
  readonly themeId: string;
  readonly enableLigatures: boolean;
}

export interface SnippetEditorTab {
  readonly id: string;
  readonly projectId: string;
  readonly code: string;
  readonly languageId: string;
  readonly tabName: string;
  readonly lineNumberStart: number;
}

/** Fields every project shape carries. Also the updateName and delete response. */
export interface ProjectHeader {
  readonly id: string;
  readonly ownerId: UserId;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Project extends ProjectHeader {
  readonly frame: SnippetFrame;
  readonly terminal: SnippetTerminal;
  readonly editorOptions: SnippetEditorOptions;
  readonly editorTabs: SnippetEditorTab[];
}

/**
 * List item (dashboard). Carries the three foreign keys because GET /project returns them today;
 * dropping them is a separate wire change (Q4).
 */
export interface ProjectSummary extends ProjectHeader {
  readonly frameId: string;
  readonly terminalId: string;
  readonly editorOptionsId: string;
  readonly editorTabs: Pick<SnippetEditorTab, 'languageId' | 'tabName'>[];
}

/** A project as one principal sees it. */
export interface ProjectView extends Project {
  readonly isOwner: boolean;
}

type WithoutIds<T> = Omit<T, 'id'>;

/** Everything needed to create a project. Defaults are already applied. */
export interface ProjectDraft {
  readonly name: string;
  readonly frame: WithoutIds<SnippetFrame>;
  readonly terminal: WithoutIds<SnippetTerminal>;
  readonly editorOptions: WithoutIds<SnippetEditorOptions>;
  readonly editorTabs: readonly Omit<SnippetEditorTab, 'id' | 'projectId'>[];
}

/**
 * A full replacement of a project's style and tabs (PUT semantics). Tabs keep their ids: a known id is
 * updated, an unknown id is created, a missing id is deleted. Running it twice gives the same row.
 */
export interface ProjectChanges {
  readonly frame: WithoutIds<SnippetFrame>;
  readonly terminal: WithoutIds<SnippetTerminal>;
  readonly editorOptions: WithoutIds<SnippetEditorOptions>;
  readonly editorTabs: readonly Omit<SnippetEditorTab, 'projectId'>[];
}

export const ProjectErrors = defineErrors({
  /** Status and message are today's. The code is new (today's 404 carried none). */
  notFound: {
    code: 'PROJECT_NOT_FOUND',
    kind: 'not_found',
    message: (p: {id: string}) => `Project with id ${p.id} not found`,
  },
  cloneSourceNotFound: {
    code: 'PROJECT_CLONE_SOURCE_NOT_FOUND',
    kind: 'not_found',
    message: (p: {id: string}) =>
      `Cannot clone project with id ${p.id} since it does not exists`,
  },
});

/**
 * Request body → draft. Today's createProjectRequestMapper: an explicit `null` falls back to the
 * schema default (Ajv `useDefaults` only fills missing properties, not nulls). Pure; unit-tested.
 */
export function draftFromCreateBody(body: ProjectCreateBody): ProjectDraft {
  // TODO: move createProjectRequestMapper's body verbatim, reading defaults from
  // SnippetFrameCreateRequestSchema / SnippetTerminalCreateRequestSchema / EditorOptionsCreateRequestSchema
  // `.properties.<field>.default`, and keep `enableLigatures` (the repository used to drop it).
  void [
    body,
    SnippetFrameCreateRequestSchema,
    SnippetTerminalCreateRequestSchema,
    EditorOptionsCreateRequestSchema,
  ];
  throw new Error('not implemented');
}

/** Request body → changes. Renames `editors` (wire) to `editorTabs` (domain). */
export function changesFromUpdateBody(body: ProjectUpdateBody): ProjectChanges {
  // TODO: {frame: body.frame, terminal: body.terminal, editorOptions: body.editorOptions,
  // editorTabs: body.editors}. The contract wraps frame, terminal and editorOptions in Type.Required,
  // so every nullable field is present (possibly null) and no defaulting happens here.
  void body;
  throw new Error('not implemented');
}

/** A copy of `source` owned by whoever creates it. `newName` null keeps the source name (today's rule). */
export function draftFromClone(source: Project, newName: string | null): ProjectDraft {
  const {id: _f, ...frame} = source.frame;
  const {id: _t, ...terminal} = source.terminal;
  const {id: _e, ...editorOptions} = source.editorOptions;
  return {
    name: newName ?? source.name,
    frame,
    terminal,
    editorOptions,
    editorTabs: source.editorTabs.map(({languageId, code, tabName, lineNumberStart}) => ({
      languageId,
      code,
      tabName,
      lineNumberStart,
    })),
  };
}

export function viewFor(project: Project, viewer: Principal): ProjectView {
  return {...project, isOwner: isOwnedBy(viewer, project.ownerId)};
}
