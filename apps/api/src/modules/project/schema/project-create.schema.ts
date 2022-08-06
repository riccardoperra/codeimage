import {Static, TSchema, Type} from '@sinclair/typebox';

const Nullable = <T extends TSchema>(type: T) =>
  Type.Union([type, Type.Null()]);

export const SnippetFrameCreateRequestSchema = Type.Object(
  {
    background: Nullable(Type.String()),
    opacity: Type.Number({
      minimum: 0,
      maximum: 100,
      default: 100,
    }),
    radius: Nullable(Type.Number()),
    padding: Type.Number(),
    visible: Type.Boolean({default: true}),
  },
  {
    title: 'SnippetFrameCreateRequest',
  },
);

export const SnippetEditorTabsCreateRequestSchema = Type.Array(
  Type.Object(
    {
      code: Type.String(),
      languageId: Type.String(),
      tabName: Type.String(),
    },
    {title: 'SnippetEditorTabCreateRequest'},
  ),
  {title: 'SnippetEditorTabsCreateRequest'},
);

const SnippetTerminalCreateRequestSchema = Type.Object(
  {
    accentVisible: Type.Boolean({default: false}),
    alternativeTheme: Type.Boolean({default: false}),
    background: Nullable(Type.String()),
    shadow: Nullable(Type.String()),
    showGlassReflection: Type.Boolean(),
    textColor: Nullable(Type.String()),
    type: Type.String(),
    opacity: Type.Number({minimum: 0, maximum: 100, default: 100}),
    showHeader: Type.Boolean(),
    showWatermark: Type.Boolean(),
  },
  {title: 'SnippetTerminalCreateRequest'},
);

const EditorOptionsCreateRequestSchema = Type.Object(
  {
    fontId: Type.String(),
    fontWeight: Type.Number({default: 400}),
    themeId: Type.String(),
    showLineNumbers: Type.Boolean({default: false}),
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

export const SnippetFrameCreateResponseSchema = Type.Object(
  {
    background: Nullable(Type.String()),
    opacity: Type.Number({
      minimum: 0,
      maximum: 100,
      default: 100,
    }),
    radius: Nullable(Type.Number()),
    padding: Type.Number(),
    visible: Nullable(Type.Boolean({default: true})),
  },
  {
    title: 'SnippetFrameCreateResponse',
  },
);

export const ProjectCreateResponseSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    createdAt: Type.Unsafe<Date>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date>({format: 'date-time'}),
    editorOptions: Type.Required(EditorOptionsCreateRequestSchema),
    frame: Type.Required(SnippetFrameCreateResponseSchema),
    terminal: Type.Required(SnippetTerminalCreateRequestSchema),
    editorTabs: SnippetEditorTabsCreateRequestSchema,
  },
  {
    title: 'ProjectCreateResponse',
  },
);

export type ProjectCreateRequest = Static<typeof ProjectCreateRequestSchema>;
export type ProjectCreateResponse = Static<typeof ProjectCreateResponseSchema>;
