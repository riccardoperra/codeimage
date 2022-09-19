import {
  Project,
  SnippetEditorOptions,
  SnippetEditorTab,
  SnippetFrame,
  SnippetTerminal,
} from '@codeimage/prisma-models/*';

export type ProjectGetByIdResponse = Project & {
  editorOptions: SnippetEditorOptions;
  terminal: SnippetTerminal;
  frame: SnippetFrame;
  editorTabs: SnippetEditorTab[];
};

export type PartialProjectGetByIdResponse = Project & {
  editorTabs: Pick<SnippetEditorTab, 'tabName' | 'languageId'>[];
};
