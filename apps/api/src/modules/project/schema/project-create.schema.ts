import {Static, TSchema, Type} from '@sinclair/typebox';

const Nullable = <T extends TSchema>(type: T) =>
  Type.Union([type, Type.Null()]);

export const SnippetFrameCreateRequestSchema = Type.Object(
  {
    background: Nullable(Type.String()),
    opacity: Nullable(Type.Number()),
    radius: Nullable(Type.Number()),
    padding: Nullable(Type.Number()),
    visible: Nullable(Type.Boolean()),
  },
  {
    title: 'SnippetFrameCreateRequest',
  },
);

export const SnippetEditorTabsCreateRequestSchema = Type.Array(
  Type.Object(
    {
      code: Nullable(Type.String()),
      languageId: Nullable(Type.String()),
      tabName: Nullable(Type.String()),
    },
    {title: 'SnippetEditorTabCreateRequest'},
  ),
  {title: 'SnippetEditorTabsCreateRequest'},
);

const SnippetTerminalCreateRequestSchema = Type.Object(
  {
    accentVisible: Nullable(Type.Boolean()),
    alternativeTheme: Nullable(Type.Boolean()),
    background: Nullable(Type.String()),
    opacity: Nullable(Type.Number()),
    shadow: Nullable(Type.String()),
    showGlassReflection: Nullable(Type.Boolean()),
    showHeader: Nullable(Type.Boolean()),
    showWatermark: Nullable(Type.Boolean()),
    textColor: Nullable(Type.String()),
    type: Nullable(Type.String()),
  },
  {title: 'SnippetTerminalCreateRequest'},
);

const EditorOptionsCreateRequestSchema = Type.Object(
  {
    fontId: Nullable(Type.String()),
    fontWeight: Nullable(Type.Number()),
    showLineNumbers: Nullable(Type.Boolean()),
    themeId: Nullable(Type.String()),
  },
  {
    title: 'EditorOptionsCreateRequest',
  },
);

export const ProjectCreateRequestSchema = Type.Object(
  {
    name: Type.String(),
    editorOptions: EditorOptionsCreateRequestSchema,
    frame: SnippetFrameCreateRequestSchema,
    terminal: SnippetTerminalCreateRequestSchema,
    editors: SnippetEditorTabsCreateRequestSchema,
  },
  {title: 'ProjectCreateRequest'},
);

export const ProjectCreateResponseSchema = Type.Object(
  {
    id: Type.String(),
    createdAt: Type.String({format: 'date-time'}),
    updatedAt: Type.String({format: 'date-time'}),
    name: Type.String(),
    editorOptions: Type.Required(EditorOptionsCreateRequestSchema),
    frame: Type.Required(SnippetFrameCreateRequestSchema),
    terminal: Type.Required(SnippetTerminalCreateRequestSchema),
    editorTabs: SnippetEditorTabsCreateRequestSchema,
  },
  {
    title: 'ProjectCreateResponse',
  },
);

export type ProjectCreateRequest = Static<typeof ProjectCreateRequestSchema>;
export type ProjectCreateResponse = Static<typeof ProjectCreateResponseSchema>;
