import type {Static} from '@sinclair/typebox';
import {Type} from '@sinclair/typebox';
import {defineContract, enumLiteral, Nullable} from '../../shared/contract.js';

export const TabMarksSchema = Type.Object({
  lines: Type.Array(
    Type.Object({
      line: Type.Integer({minimum: 1}),
      kind: Type.Union([
        Type.Literal('added'),
        Type.Literal('removed'),
        Type.Literal('highlight'),
      ]),
    }),
  ),
  focusedLines: Type.Array(Type.Integer({minimum: 1})),
});

export type TabMarks = Static<typeof TabMarksSchema>;

export const FrameSignatureSchema = Type.Object({
  handle: Type.String(),
  position: Type.Union([
    Type.Literal('bottom-left'),
    Type.Literal('bottom-right'),
  ]),
});

export const ExportTargetSchema = Type.Union([
  Type.Literal('x-landscape'),
  Type.Literal('square'),
  Type.Literal('linkedin-portrait'),
  Type.Literal('open-graph'),
]);

export const FrameExportProperties = {
  exportTarget: Type.Optional(Nullable(ExportTargetSchema)),
  aspectRatio: Type.Optional(Type.Union([Type.Null(), Type.String()])),
  signature: Type.Optional(Nullable(FrameSignatureSchema)),
};

export const BaseProjectResponseSchema = Type.Object(
  {
    id: Type.String({format: 'uuid'}),
    name: Type.String(),
    createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    ownerId: Type.String({format: 'uuid'}),
  },
  {title: 'BaseProjectResponse'},
);

export const BaseSnippetEditorTabsSchema = Type.Array(
  Type.Object({
    id: Type.String({format: 'uuid'}),
    projectId: Type.String({format: 'uuid'}),
    code: Type.String(),
    languageId: Type.String(),
    tabName: Type.String(),
    lineNumberStart: Type.Integer({minimum: 1, maximum: 999_999}),
    marks: Type.Optional(Nullable(TabMarksSchema)),
  }),
);

export const BaseSnippetFrameSchema = Type.Object({
  ...FrameExportProperties,
  id: Type.String({format: 'uuid'}),
  background: Type.String(),
  padding: Type.Number(),
  radius: Type.Number(),
  visible: Type.Boolean(),
  opacity: Type.Number(),
});

export const SnippetTerminalBorderType = enumLiteral(['glass'] as const);

export const BaseSnippetTerminalSchema = Type.Object({
  id: Type.String({format: 'uuid'}),
  showHeader: Type.Boolean(),
  type: Type.String(),
  accentVisible: Type.Boolean(),
  shadow: Nullable(Type.String()),
  background: Type.String(),
  textColor: Type.String(),
  showWatermark: Type.Boolean(),
  showGlassReflection: Type.Boolean(),
  opacity: Type.Number(),
  alternativeTheme: Type.Boolean(),
  borderType: Nullable(SnippetTerminalBorderType),
});

export const BaseSnippetEditorOptionsSchema = Type.Object({
  id: Type.String({format: 'uuid'}),
  fontId: Type.String(),
  fontWeight: Type.Number(),
  showLineNumbers: Type.Boolean(),
  themeId: Type.String(),
  enableLigatures: Type.Boolean(),
});

export const SnippetFrameCreateRequestSchema = Type.Object(
  {
    ...FrameExportProperties,
    background: Nullable(Type.String()),
    opacity: Nullable(Type.Number({minimum: 0, maximum: 100, default: 100})),
    radius: Nullable(Type.Number({default: 24})),
    padding: Nullable(Type.Number({default: 32})),
    visible: Nullable(Type.Boolean({default: true})),
  },
  {title: 'SnippetFrameCreateRequest'},
);

export const SnippetEditorTabsCreateRequestSchema = Type.Array(
  Type.Object(
    {
      code: Type.String(),
      languageId: Type.String(),
      tabName: Type.String(),
      lineNumberStart: Type.Integer({minimum: 1, maximum: 999_999}),
      marks: Type.Optional(Nullable(TabMarksSchema)),
    },
    {title: 'SnippetEditorTabCreateRequest'},
  ),
  {title: 'SnippetEditorTabsCreateRequest'},
);

export const SnippetTerminalCreateRequestSchema = Type.Object(
  {
    accentVisible: Nullable(Type.Boolean({default: false})),
    alternativeTheme: Nullable(Type.Boolean({default: false})),
    background: Nullable(Type.String()),
    shadow: Nullable(Type.String()),
    showGlassReflection: Nullable(Type.Boolean({default: false})),
    textColor: Nullable(Type.String()),
    type: Type.String(),
    opacity: Nullable(Type.Number({minimum: 0, maximum: 100, default: 100})),
    showHeader: Type.Boolean(),
    showWatermark: Nullable(Type.Boolean({default: true})),
    borderType: Nullable(SnippetTerminalBorderType),
  },
  {title: 'SnippetTerminalCreateRequest'},
);

export const EditorOptionsCreateRequestSchema = Type.Object(
  {
    fontId: Type.String(),
    fontWeight: Type.Number({default: 400}),
    themeId: Type.String(),
    showLineNumbers: Nullable(Type.Boolean({default: false})),
    enableLigatures: Type.Boolean(),
  },
  {title: 'EditorOptionsCreateRequest'},
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
    ...FrameExportProperties,
    background: Nullable(Type.String()),
    opacity: Type.Number({minimum: 0, maximum: 100, default: 100}),
    radius: Nullable(Type.Number()),
    padding: Type.Number(),
    visible: Nullable(Type.Boolean({default: true})),
  },
  {title: 'SnippetFrameCreateResponse'},
);

export const ProjectCreateResponseSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    editorOptions: Type.Required(EditorOptionsCreateRequestSchema),
    frame: SnippetFrameCreateResponseSchema,
    terminal: Type.Required(SnippetTerminalCreateRequestSchema),
    editorTabs: SnippetEditorTabsCreateRequestSchema,
  },
  {title: 'ProjectCreateResponse'},
);

export const SnippetFrameUpdateRequestSchema = Type.Object(
  {
    ...FrameExportProperties,
    background: Nullable(Type.String()),
    opacity: Type.Number(),
    radius: Nullable(Type.Number()),
    padding: Type.Number(),
    visible: Type.Boolean(),
  },
  {title: 'SnippetFrameUpdateRequest'},
);

export const SnippetEditorTabsUpdateRequestSchema = Type.Array(
  Type.Object(
    {
      id: Type.String(),
      code: Type.String(),
      languageId: Type.String(),
      tabName: Type.String(),
      lineNumberStart: Type.Integer({minimum: 1, maximum: 999_999}),
      marks: Type.Optional(Nullable(TabMarksSchema)),
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
    borderType: Nullable(SnippetTerminalBorderType),
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
  {title: 'EditorOptionsUpdateRequest'},
);

export const ProjectUpdateRequestSchema = Type.Object(
  {
    editorOptions: Type.Required(EditorOptionsUpdateRequestSchema),
    frame: SnippetFrameUpdateRequestSchema,
    terminal: Type.Required(SnippetTerminalUpdateRequestSchema),
    editors: SnippetEditorTabsUpdateRequestSchema,
  },
  {title: 'ProjectUpdateRequest'},
);

export const ProjectUpdateResponseSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    ownerId: Type.String({format: 'uuid'}),
    editorOptions: Type.Required(EditorOptionsUpdateRequestSchema),
    frame: SnippetFrameUpdateRequestSchema,
    terminal: Type.Required(SnippetTerminalUpdateRequestSchema),
    editorTabs: SnippetEditorTabsUpdateRequestSchema,
  },
  {title: 'ProjectUpdateResponse'},
);

export const ProjectGetByIdResponseSchema = Type.Intersect([
  BaseProjectResponseSchema,
  Type.Object({
    editorTabs: BaseSnippetEditorTabsSchema,
    editorOptions: BaseSnippetEditorOptionsSchema,
    frame: BaseSnippetFrameSchema,
    terminal: BaseSnippetTerminalSchema,
    isOwner: Type.Boolean(),
  }),
]);

export const ProjectSummarySchema = Type.Intersect([
  BaseProjectResponseSchema,
  Type.Object({
    frameId: Type.String(),
    terminalId: Type.String(),
    editorOptionsId: Type.String(),
    editorTabs: Type.Array(
      Type.Object({
        languageId: Type.String(),
        tabName: Type.String(),
      }),
    ),
  }),
]);

export const ProjectDeleteResponseSchema = Type.Intersect(
  [BaseProjectResponseSchema],
  {title: 'ProjectDeleteResponse'},
);

const ProjectIdParams = Type.Object({id: Type.String()});

export const projectContract = defineContract('Project', {
  create: {
    method: 'POST',
    url: '/',
    schema: {
      summary: 'Create a new CodeImage project',
      body: ProjectCreateRequestSchema,
      response: {200: ProjectCreateResponseSchema},
    },
  },
  list: {
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all CodeImage projects by the current user',
      response: {200: Type.Array(ProjectSummarySchema)},
    },
  },
  get: {
    method: 'GET',
    url: '/:id',
    schema: {
      summary: 'Returns a CodeImage project by id',
      params: ProjectIdParams,
      response: {200: ProjectGetByIdResponseSchema},
    },
    config: {auth: 'optional'},
  },
  update: {
    method: 'PUT',
    url: '/:id',
    schema: {
      summary: 'Update an existing CodeImage project',
      body: ProjectUpdateRequestSchema,
      params: ProjectIdParams,
      response: {200: ProjectUpdateResponseSchema},
    },
  },
  updateName: {
    method: 'PUT',
    url: '/:id/name',
    schema: {
      summary: 'Updates `name` of a CodeImage project',
      body: Type.Object({name: Type.String()}),
      params: ProjectIdParams,
      response: {200: BaseProjectResponseSchema},
    },
  },
  remove: {
    method: 'DELETE',
    url: '/:id',
    schema: {
      params: ProjectIdParams,
      summary: 'Delete an existing CodeImage project',
      response: {200: ProjectDeleteResponseSchema},
    },
  },
  clone: {
    method: 'POST',
    url: '/:id/clone',
    schema: {
      summary: 'Clone a CodeImage project from an existing one',
      params: ProjectIdParams,
      body: Type.Object({newName: Type.Optional(Type.String())}),
      response: {200: ProjectCreateResponseSchema},
    },
  },
});

export type ProjectCreateBody = Static<typeof ProjectCreateRequestSchema>;
export type ProjectUpdateBody = Static<typeof ProjectUpdateRequestSchema>;
export type ProjectGetByIdResponse = Static<
  typeof ProjectGetByIdResponseSchema
>;

export type ProjectCreateResponse = Static<typeof ProjectCreateResponseSchema>;
export type ProjectUpdateResponse = Static<typeof ProjectUpdateResponseSchema>;
export type ProjectListItem = Static<typeof ProjectSummarySchema>;
