import {
  Project,
  SnippetEditorOptions,
  SnippetEditorTab,
  SnippetFrame,
  SnippetTerminal,
} from '@codeimage/prisma-models/*';

type IdAndProjectId = 'id' | 'projectId';

interface EditorUpdateRequest {
  id: NonNullable<SnippetEditorTab['id']>;
  code: NonNullable<SnippetEditorTab['code']>;
  languageId: NonNullable<SnippetEditorTab['languageId']>;
  tabName: NonNullable<SnippetEditorTab['tabName']>;
}

interface EditorTabResponse {
  id: NonNullable<SnippetEditorTab['id']>;
  code: NonNullable<SnippetEditorTab['code']>;
  languageId: NonNullable<SnippetEditorTab['languageId']>;
  tabName: NonNullable<SnippetEditorTab['tabName']>;
}

export interface ProjectUpdateRequest {
  editorOptions: Omit<SnippetEditorOptions, IdAndProjectId>;
  terminal: Omit<SnippetTerminal, IdAndProjectId>;
  frame: Omit<SnippetFrame, IdAndProjectId>;
  editors: EditorUpdateRequest[];
}

export type ProjectUpdateResponse = Project & {
  editorOptions: SnippetEditorOptions;
  terminal: SnippetTerminal;
  frame: SnippetFrame;
  editorTabs: EditorTabResponse[];
};
