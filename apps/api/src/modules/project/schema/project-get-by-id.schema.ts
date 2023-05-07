import {Static, Type} from '@sinclair/typebox';
import {
  BaseProjectResponseSchema,
  BaseSnippetEditorOptionsSchema,
  BaseSnippetEditorTabsSchema,
  BaseSnippetFrameSchema,
  BaseSnippetTerminalSchema,
} from './project.schema.js';

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

export const PartialProjectGetByIdResponseSchema = Type.Intersect([
  BaseProjectResponseSchema,
  Type.Object({
    editorTabs: Type.Array(
      Type.Object({
        languageId: Type.String(),
        tabName: Type.String(),
      }),
    ),
  }),
]);

export type ProjectCompleteResponse = Static<
  typeof ProjectGetByIdResponseSchema
>;

export type ProjectGetByIdResponse = Static<
  typeof PartialProjectGetByIdResponseSchema
>;
