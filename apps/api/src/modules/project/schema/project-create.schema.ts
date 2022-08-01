import {Static, Type} from '@sinclair/typebox';
import S from 'fluent-json-schema';

export const editorOptionsCreateRequest = S.object()
  .id('editorOptionsCreateRequest')
  .prop(
    'fontId',
    S.string().description('The font id of the snippet').required(),
  )
  .prop('fontWeight', S.number().description('The font weight of the snippet'))
  .prop(
    'showLineNumbers',
    S.boolean().description('Show/hide the editor line numbers'),
  )
  .prop('themeId', S.string().description('The theme id of the snippet'));

export const SnippetFrameCreateRequestSchema = Type.Object({
  background: Type.Optional(Type.String()),
  opacity: Type.Optional(Type.Number()),
  radius: Type.Optional(Type.Number()),
  padding: Type.Optional(Type.Number()),
  visible: Type.Optional(Type.Boolean()),
});

export const SnippetEditorTabsCreateRequestSchema = Type.Array(
  Type.Object(
    {
      code: Type.String(),
      languageId: Type.String(),
      tabName: Type.String(),
    },
    {$id: 'SnippetEditorTabCreateRequest'},
  ),
  {$id: 'SnippetEditorTabsCreateRequest'},
);

const SnippetTerminalCreateRequestSchema = Type.Object(
  {
    accentVisible: Type.Boolean(),
    alternativeTheme: Type.Boolean(),
    background: Type.String(),
    opacity: Type.Number(),
    shadow: Type.String(),
    showGlassReflection: Type.Boolean(),
    showHeader: Type.Boolean(),
    showWatermark: Type.Boolean(),
    textColor: Type.String(),
    type: Type.String(),
  },
  {id: 'SnippetTerminalCreateRequest'},
);

const EditorOptionsCreateRequestSchema = Type.Object(
  {
    fontId: Type.Optional(Type.String()),
    fontWeight: Type.Optional(Type.Number()),
    showLineNumbers: Type.Optional(Type.Boolean()),
    themeId: Type.Optional(Type.String()),
  },
  {
    $id: 'EditorOptionsCreateRequest',
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
  {$id: 'ProjectCreateRequest'},
);

export const ProjectCreateResponseSchema = Type.Object(
  {
    id: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    name: Type.String(),
    editorOptions: Type.Required(EditorOptionsCreateRequestSchema),
    frame: Type.Required(SnippetFrameCreateRequestSchema),
    terminal: Type.Required(SnippetTerminalCreateRequestSchema),
    editors: SnippetEditorTabsCreateRequestSchema,
  },
  {
    $id: 'ProjectCreateResponse',
  },
);

export type ProjectCreateRequest = Static<typeof ProjectCreateRequestSchema>;
export type ProjectCreateResponse = Static<typeof ProjectCreateResponseSchema>;
