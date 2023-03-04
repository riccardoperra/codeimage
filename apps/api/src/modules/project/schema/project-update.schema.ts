import {Static, Type} from '@sinclair/typebox';
import {Nullable} from '../../../common/typebox/nullable';

export const SnippetFrameUpdateRequestSchema = Type.Object(
  {
    background: Nullable(Type.String()),
    opacity: Type.Number(),
    radius: Nullable(Type.Number()),
    padding: Type.Number(),
    visible: Type.Boolean(),
  },
  {
    title: 'SnippetFrameUpdateRequest',
  },
);

export const SnippetEditorTabsUpdateRequestSchema = Type.Array(
  Type.Object(
    {
      id: Type.String(),
      code: Type.String(),
      languageId: Type.String(),
      tabName: Type.String(),
    },
    {title: 'SnippetEditorTabUpdateRequest'},
  ),
  {title: 'SnippetEditorTabsUpdateRequest', minItems: 1},
);

const SnippetTerminalUpdateRequestSchema = Type.Object(
  {
    accentVisible: Type.Boolean(),
    alternativeTheme: Type.Boolean(),
    background: Nullable(Type.String()),
    opacity: Type.Number(),
    shadow: Nullable(Type.String()),
    showGlassReflection: Type.Boolean(),
    showHeader: Type.Boolean(),
    showWatermark: Type.Boolean(),
    textColor: Nullable(Type.String()),
    type: Type.String(),
  },
  {title: 'SnippetTerminalUpdateRequest'},
);

const EditorOptionsUpdateRequestSchema = Type.Object(
  {
    fontId: Type.String(),
    fontWeight: Type.Number(),
    themeId: Type.String(),
    showLineNumbers: Type.Boolean(),
    enableLigatures: Type.Boolean(),
  },
  {
    title: 'EditorOptionsUpdateRequest',
  },
);

export const ProjectUpdateRequestSchema = Type.Object(
  {
    editorOptions: Type.Required(EditorOptionsUpdateRequestSchema),
    frame: Type.Required(SnippetFrameUpdateRequestSchema),
    terminal: Type.Required(SnippetTerminalUpdateRequestSchema),
    editors: SnippetEditorTabsUpdateRequestSchema,
  },
  {title: 'ProjectUpdateRequest'},
);

export const ProjectUpdateResponseSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    createdAt: Type.Unsafe<Date>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date>({format: 'date-time'}),
    ownerId: Type.String({format: 'uuid'}),
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
