import {randomUUID} from 'node:crypto';
import type {Static} from '@sinclair/typebox';
import {Value} from '@sinclair/typebox/value';
import {
  AnimationSettingsSchema,
  type AnimationSettings,
  ExportTargetSchema,
  type FrameSignatureSchema,
  SignaturePlatformSchema,
  SignaturePositionSchema,
  SignatureStyleSchema,
  TabMarksSchema,
  type TabMarks,
} from './project.contract.js';
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
  readonly exportTarget?: Static<typeof ExportTargetSchema> | null;
  readonly aspectRatio?: string | null;
  readonly signature?: Static<typeof FrameSignatureSchema> | null;
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
  readonly marks: TabMarks;
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
  readonly animation: AnimationSettings | null;
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
  // A clone names its tabs, so its animation steps can point at them.
  readonly editorTabs: readonly (Omit<SnippetEditorTab, 'id' | 'projectId'> & {
    readonly id?: string;
  })[];
  readonly animation: AnimationSettings | null;
}

export interface ProjectChanges {
  readonly frame: WithoutIds<SnippetFrame>;
  // Absent when the client predates the field, so the stored value stays.
  readonly terminal: Omit<WithoutIds<SnippetTerminal>, 'surface'> & {
    readonly surface?: SnippetTerminal['surface'];
  };
  readonly editorOptions: WithoutIds<SnippetEditorOptions>;
  readonly editorTabs: readonly Omit<SnippetEditorTab, 'projectId'>[];
  // Left unchanged when undefined, for clients without animations.
  readonly animation?: AnimationSettings;
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
      aspectRatio: body.frame.aspectRatio ?? null,
      exportTarget: body.frame.exportTarget ?? null,
      signature: body.frame.signature ?? null,
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
      marks: parseTabMarks(editor.marks),
    })),
    animation: null,
  };
}

export function changesFromUpdateBody(body: ProjectUpdateBody): ProjectChanges {
  return {
    frame: body.frame,
    terminal: {...body.terminal, surface: body.terminal.surface ?? undefined},
    editorOptions: body.editorOptions,
    editorTabs: body.editors.map(editor => ({
      ...editor,
      marks: parseTabMarks(editor.marks),
    })),
    animation: parseAnimationSettings(body.animation) ?? undefined,
  };
}

export function draftFromClone(
  source: Project,
  newName: string | null,
  newTabId: () => string = randomUUID,
): ProjectDraft {
  const {id: _f, ...frame} = source.frame;
  const {id: _t, ...terminal} = source.terminal;
  const {id: _e, ...editorOptions} = source.editorOptions;
  const tabIds = new Map(source.editorTabs.map(tab => [tab.id, newTabId()]));
  const {animation} = source;
  return {
    name: newName ?? source.name,
    frame,
    terminal,
    editorOptions,
    editorTabs: source.editorTabs.map(
      ({id, languageId, code, tabName, lineNumberStart, marks}) => ({
        id: tabIds.get(id),
        languageId,
        code,
        tabName,
        lineNumberStart,
        marks,
      }),
    ),
    animation: animation && {
      ...animation,
      steps: animation.steps.map(step => ({
        ...step,
        editorId: tabIds.get(step.editorId) ?? step.editorId,
      })),
    },
  };
}

export function viewFor(project: Project, viewer: Principal): ProjectView {
  return {...project, isOwner: isOwnedBy(viewer, project.ownerId)};
}

type FrameSignature = Static<typeof FrameSignatureSchema>;

export interface FrameSignatureColumns {
  signatureHandle?: string | null;
  signaturePosition?: string | null;
  signatureStyle?: string | null;
  signaturePlatform?: string | null;
  signatureName?: string | null;
  signatureAvatar?: string | null;
  signatureProfile?: string | null;
  /** The saved signature the copy came from; not a foreign key, so deleting it keeps the copy. */
  signatureId?: string | null;
}

const literalOf = <T extends string>(
  schema: {anyOf: readonly {const: T}[]},
  value: string | null | undefined,
): T | undefined => schema.anyOf.find(item => item.const === value)?.const;

export function readFrameSignature(
  frame: FrameSignatureColumns,
): FrameSignature | null {
  const handle = frame.signatureHandle;
  const position = literalOf(SignaturePositionSchema, frame.signaturePosition);
  if (!handle || !position) return null;
  return {
    handle,
    position,
    style: literalOf(SignatureStyleSchema, frame.signatureStyle) ?? 'minimal',
    platform:
      literalOf(SignaturePlatformSchema, frame.signaturePlatform) ?? null,
    name: frame.signatureName ?? null,
    avatar: frame.signatureAvatar ?? null,
    profile: frame.signatureProfile ?? null,
    savedId: frame.signatureId ?? null,
  };
}

/** The columns to write; `undefined` leaves a stored signature as it is. */
export function writeFrameSignature(
  signature: FrameSignature | null | undefined,
): FrameSignatureColumns {
  if (signature === undefined) return {};
  return {
    signatureHandle: signature?.handle ?? null,
    signaturePosition: signature?.position ?? null,
    signatureStyle: signature?.style ?? null,
    signaturePlatform: signature?.platform ?? null,
    signatureName: signature?.name ?? null,
    signatureAvatar: signature?.avatar ?? null,
    signatureProfile: signature?.profile ?? null,
    signatureId: signature?.savedId ?? null,
  };
}

export function readFrameExportProperties(
  frame: {exportTarget?: string | null} & FrameSignatureColumns,
) {
  return {
    exportTarget:
      ExportTargetSchema.anyOf.find(
        target => target.const === frame.exportTarget,
      )?.const ?? null,
    signature: readFrameSignature(frame),
  };
}

// A timeline of 0 ms has no frame to render, so it is no animation.
export function parseAnimationSettings(
  value: unknown,
): AnimationSettings | null {
  if (!Value.Check(AnimationSettingsSchema, value)) return null;
  const {steps, transitionMs} = value;
  const totalMs =
    steps.reduce((total, step) => total + step.holdMs, 0) +
    (steps.length - 1) * transitionMs;
  return totalMs > 0 ? value : null;
}

export function parseTabMarks(value: unknown): TabMarks {
  return Value.Check(TabMarksSchema, value)
    ? value
    : {lines: [], focusedLines: []};
}

export function readTerminalSurface(
  value: string | null | undefined,
): SnippetTerminal['surface'] {
  return value === 'wash' ? 'wash' : 'solid';
}
