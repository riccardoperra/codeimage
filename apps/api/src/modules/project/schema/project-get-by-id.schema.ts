import {Static, Type} from '@sinclair/typebox';
import {
  BaseProjectResponseSchema,
  BaseSnippetEditorTabsSchema,
  BaseSnippetFrameSchema,
  BaseSnippetTerminalSchema,
  BaseSnippetEditorOptionsSchema,
} from './project.schema';

export const ProjectGetByIdResponseSchema = Type.Intersect([
  BaseProjectResponseSchema,
  Type.Object({
    editorTabs: BaseSnippetEditorTabsSchema,
    editorOptions: BaseSnippetEditorOptionsSchema,
    frame: BaseSnippetFrameSchema,
    terminal: BaseSnippetTerminalSchema,
  }),
]);

export type ProjectGetByIdResponse = Static<
  typeof ProjectGetByIdResponseSchema
>;
