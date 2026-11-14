/**
 * Project HTTP contract (/api/v1/project). Other modules' contracts may import it (preset reuses the
 * snippet style schemas), and api-types.ts derives ProjectApi from it.
 *
 * Schemas are moved verbatim from today's modules/project/schema/*.ts and the route files: same keys,
 * same optionality and nullability, same defaults, same titles. The in-flight P5 plan
 * (`marks Json?` on SnippetEditorTab) edits the tab schemas here.
 */
import type {Static} from '@sinclair/typebox';
import {Type} from '@sinclair/typebox';
import {defineContract, enumLiteral, Nullable} from '../../shared/contract.js';

// --- Shared shapes (project.schema.ts) -----------------------------------------------------------

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
  }),
);

export const BaseSnippetFrameSchema = Type.Object({
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

// --- Create (project-create.schema.ts) -----------------------------------------------------------

export const SnippetFrameCreateRequestSchema = Type.Object(
  {
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
    frame: Type.Required(SnippetFrameCreateResponseSchema),
    terminal: Type.Required(SnippetTerminalCreateRequestSchema),
    editorTabs: SnippetEditorTabsCreateRequestSchema,
  },
  {title: 'ProjectCreateResponse'},
);

// --- Update (project-update.schema.ts) -----------------------------------------------------------

export const SnippetFrameUpdateRequestSchema = Type.Object(
  {
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

/**
 * `Type.Required` turns the Nullable (optional) fields of frame and terminal into required-but-nullable
 * keys: an update must send `background: null`, it cannot omit it.
 */
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
    createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    ownerId: Type.String({format: 'uuid'}),
    editorOptions: Type.Required(EditorOptionsUpdateRequestSchema),
    frame: Type.Required(SnippetFrameUpdateRequestSchema),
    terminal: Type.Required(SnippetTerminalUpdateRequestSchema),
    editorTabs: SnippetEditorTabsUpdateRequestSchema,
  },
  {title: 'ProjectUpdateResponse'},
);

// --- Read and delete (project-get-by-id.schema.ts, project-delete.schema.ts) ---------------------

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

/**
 * GET /project has no response schema today, so it serializes the whole Prisma row. This schema is
 * today's PartialProjectGetByIdResponseSchema plus the three scalar foreign keys that row carries, so
 * the wire shape does not change. Dropping frameId, terminalId and editorOptionsId is a separate,
 * deliberate change (open question Q4).
 */
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

// --- Operations (routes/v1/project/*.ts) ---------------------------------------------------------

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
    // Projects are shareable by link (#325): anyone may read, the owner sees isOwner = true.
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
export type ProjectGetByIdResponse = Static<typeof ProjectGetByIdResponseSchema>;
