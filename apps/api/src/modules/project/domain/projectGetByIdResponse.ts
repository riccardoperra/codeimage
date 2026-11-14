import type {EditorTabResponse} from './editorTab.js';
import type {
  Project,
  SnippetEditorOptions,
  SnippetEditorTab,
  SnippetFrame,
  SnippetTerminal,
} from '@codeimage/prisma-models';

export type ProjectGetByIdResponse = Project & {
  editorOptions: SnippetEditorOptions;
  terminal: SnippetTerminal;
  frame: SnippetFrame;
  editorTabs: EditorTabResponse[];
};

export type PartialProjectGetByIdResponse = Project & {
  editorTabs: Pick<SnippetEditorTab, 'tabName' | 'languageId'>[];
};
