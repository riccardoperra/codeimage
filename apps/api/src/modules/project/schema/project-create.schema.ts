import {Static, Type} from '@sinclair/typebox';
import {Nullable} from '../../../common/typebox/nullable';

export const SnippetFrameCreateRequestSchema = Type.Object(
  {
    background: Nullable(Type.String()),
    opacity: Nullable(
      Type.Number({
        minimum: 0,
        maximum: 100,
      }),
      {default: 100},
    ),
    radius: Nullable(Type.Number(), {default: 24}),
    padding: Nullable(Type.Number(), {default: 32}),
    visible: Nullable(Type.Boolean(), {default: true}),
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

export const SnippetTerminalCreateRequestSchema = Type.Object(
  {
    accentVisible: Nullable(Type.Boolean(), {default: false}),
    alternativeTheme: Nullable(Type.Boolean(), {default: false}),
    background: Nullable(Type.String()),
    shadow: Nullable(Type.String()),
    showGlassReflection: Nullable(Type.Boolean(), {default: false}),
    textColor: Nullable(Type.String()),
    type: Type.String(),
    opacity: Nullable(Type.Number({minimum: 0, maximum: 100}), {default: 100}),
    showHeader: Type.Boolean(),
    showWatermark: Nullable(Type.Boolean(), {default: true}),
  },
  {title: 'SnippetTerminalCreateRequest'},
);

export const EditorOptionsCreateRequestSchema = Type.Object(
  {
    fontId: Type.String(),
    fontWeight: Type.Number({default: 400}),
    themeId: Type.String(),
    showLineNumbers: Nullable(Type.Boolean(), {default: false}),
    enableLigatures: Type.Boolean(),
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
    visible: Nullable(Type.Boolean(), {default: true}),
  },
  {
    title: 'SnippetFrameCreateResponse',
  },
);

export const ProjectCreateResponseSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
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
