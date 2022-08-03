import {
  Project,
  SnippetEditorOptions,
  SnippetEditorTab,
  SnippetFrame,
  SnippetTerminal,
} from '@codeimage/prisma-models/*';

type IdAndProjectId = 'id' | 'projectId';

export interface ProjectUpdateRequest {
  editorOptions: Omit<SnippetEditorOptions, IdAndProjectId>;
  terminal: Omit<SnippetTerminal, IdAndProjectId>;
  frame: Omit<SnippetFrame, IdAndProjectId>;
  editors: SnippetEditorTab[];
}

export type ProjectUpdateResponse = Project & {
  editorOptions: SnippetEditorOptions | null;
  terminal: SnippetTerminal | null;
  frame: SnippetFrame | null;
  editorTabs: SnippetEditorTab[];
};
