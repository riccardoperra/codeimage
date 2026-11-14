import {defineErrors} from '../../shared/errors.js';
import {
  isOwnedBy,
  type Principal,
  type UserId,
} from '../../shared/principal.js';
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
  readonly surface: 'solid' | 'wash';
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

export interface ProjectSummary extends ProjectHeader {
  readonly frameId: string;
  readonly terminalId: string;
  readonly editorOptionsId: string;
  readonly editorTabs: Pick<SnippetEditorTab, 'languageId' | 'tabName'>[];
}

export interface ProjectView extends Project {
  readonly isOwner: boolean;
}

type WithoutIds<T> = Omit<T, 'id'>;

export interface ProjectDraft {
  readonly name: string;
  readonly frame: WithoutIds<SnippetFrame>;
  readonly terminal: WithoutIds<SnippetTerminal>;
  readonly editorOptions: WithoutIds<SnippetEditorOptions>;
  readonly editorTabs: readonly Omit<SnippetEditorTab, 'id' | 'projectId'>[];
}

export interface ProjectChanges {
  readonly frame: WithoutIds<SnippetFrame>;
  // Absent when the client predates the field, so the stored value stays.
  readonly terminal: Omit<WithoutIds<SnippetTerminal>, 'surface'> & {
    readonly surface?: SnippetTerminal['surface'];
  };
  readonly editorOptions: WithoutIds<SnippetEditorOptions>;
  readonly editorTabs: readonly Omit<SnippetEditorTab, 'projectId'>[];
}

export const ProjectErrors = defineErrors({
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

export function draftFromCreateBody(body: ProjectCreateBody): ProjectDraft {
  return {
    name: body.name,
    frame: {
      padding:
        body.frame.padding ??
        SnippetFrameCreateRequestSchema.properties.padding.default,
      visible:
        body.frame.visible ??
        SnippetFrameCreateRequestSchema.properties.visible.default,
      background: body.frame.background ?? null,
      opacity:
        body.frame.opacity ??
        SnippetFrameCreateRequestSchema.properties.opacity.default,
      radius:
        body.frame.radius ??
        SnippetFrameCreateRequestSchema.properties.radius.default,
    },
    terminal: {
      background: body.terminal.background ?? null,
      opacity:
        body.terminal.opacity ??
        SnippetTerminalCreateRequestSchema.properties.opacity.default,
      showHeader: body.terminal.showHeader,
      showGlassReflection:
        body.terminal.showGlassReflection ??
        SnippetTerminalCreateRequestSchema.properties.showGlassReflection
          .default,
      showWatermark:
        body.terminal.showWatermark ??
        SnippetTerminalCreateRequestSchema.properties.showWatermark.default,
      textColor: body.terminal.textColor ?? null,
      type: body.terminal.type,
      accentVisible:
        body.terminal.accentVisible ??
        SnippetTerminalCreateRequestSchema.properties.accentVisible.default,
      alternativeTheme:
        body.terminal.alternativeTheme ??
        SnippetTerminalCreateRequestSchema.properties.alternativeTheme.default,
      shadow: body.terminal.shadow ?? null,
      borderType: body.terminal.borderType ?? null,
      surface: readTerminalSurface(body.terminal.surface),
    },
    editorOptions: {
      fontWeight: body.editorOptions.fontWeight,
      fontId: body.editorOptions.fontId,
      showLineNumbers:
        body.editorOptions.showLineNumbers ??
        EditorOptionsCreateRequestSchema.properties.showLineNumbers.default,
      themeId: body.editorOptions.themeId,
      enableLigatures: body.editorOptions.enableLigatures,
    },
    editorTabs: body.editors.map(editor => ({
      languageId: editor.languageId,
      code: editor.code,
      tabName: editor.tabName,
      lineNumberStart: editor.lineNumberStart,
    })),
  };
}

export function changesFromUpdateBody(body: ProjectUpdateBody): ProjectChanges {
  return {
    frame: body.frame,
    terminal: {...body.terminal, surface: body.terminal.surface ?? undefined},
    editorOptions: body.editorOptions,
    editorTabs: body.editors,
  };
}

export function draftFromClone(
  source: Project,
  newName: string | null,
): ProjectDraft {
  const {id: _f, ...frame} = source.frame;
  const {id: _t, ...terminal} = source.terminal;
  const {id: _e, ...editorOptions} = source.editorOptions;
  return {
    name: newName ?? source.name,
    frame,
    terminal,
    editorOptions,
    editorTabs: source.editorTabs.map(
      ({languageId, code, tabName, lineNumberStart}) => ({
        languageId,
        code,
        tabName,
        lineNumberStart,
      }),
    ),
  };
}

export function viewFor(project: Project, viewer: Principal): ProjectView {
  return {...project, isOwner: isOwnedBy(viewer, project.ownerId)};
}

export function readTerminalSurface(
  value: string | null | undefined,
): SnippetTerminal['surface'] {
  return value === 'wash' ? 'wash' : 'solid';
}
