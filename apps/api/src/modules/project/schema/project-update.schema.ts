import {Static, TSchema, Type} from '@sinclair/typebox';

const Nullable = <T extends TSchema>(type: T) =>
  Type.Union([type, Type.Null()]);

export const SnippetFrameUpdateRequestSchema = Type.Object(
  {
    background: Nullable(Type.String()),
    opacity: Nullable(Type.Number()),
    radius: Nullable(Type.Number()),
    padding: Nullable(Type.Number()),
    visible: Nullable(Type.Boolean()),
  },
  {
    title: 'SnippetFrameUpdateRequest',
  },
);

export const SnippetEditorTabsUpdateRequestSchema = Type.Array(
  Type.Object(
    {
      code: Nullable(Type.String()),
      languageId: Nullable(Type.String()),
      tabName: Nullable(Type.String()),
    },
    {title: 'SnippetEditorTabUpdateRequest'},
  ),
  {title: 'SnippetEditorTabsUpdateRequest'},
);

const SnippetTerminalUpdateRequestSchema = Type.Object(
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
  {title: 'SnippetTerminalUpdateRequest'},
);

const EditorOptionsUpdateRequestSchema = Type.Object(
  {
    fontId: Nullable(Type.String()),
    fontWeight: Nullable(Type.Number()),
    showLineNumbers: Nullable(Type.Boolean()),
    themeId: Nullable(Type.String()),
  },
  {
    title: 'EditorOptionsUpdateRequest',
  },
);

export const ProjectUpdateRequestSchema = Type.Object(
  {
    editorOptions: EditorOptionsUpdateRequestSchema,
    frame: SnippetFrameUpdateRequestSchema,
    terminal: SnippetTerminalUpdateRequestSchema,
    editors: SnippetEditorTabsUpdateRequestSchema,
  },
  {title: 'ProjectUpdateRequest'},
);

export const ProjectUpdateResponseSchema = Type.Object(
  {
    id: Type.String(),
    createdAt: Type.String({format: 'date-time'}),
    updatedAt: Type.String({format: 'date-time'}),
    name: Type.String(),
    editorOptions: Type.Required(EditorOptionsUpdateRequestSchema),
    frame: Type.Required(SnippetFrameUpdateRequestSchema),
    terminal: Type.Required(SnippetTerminalUpdateRequestSchema),
    editorTabs: SnippetEditorTabsUpdateRequestSchema,
  },
  {
    title: 'ProjectUpdateResponse',
  },
);

export type ProjectUpdateRequest = Static<typeof ProjectUpdateRequestSchema>;
export type ProjectUpdateResponse = Static<typeof ProjectUpdateResponseSchema>;
