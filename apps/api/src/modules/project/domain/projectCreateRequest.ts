import type {EditorTabResponse} from './editorTab.js';
import type {TabMarks} from '../../../schemas/marks.js';
import type {
  Project,
  SnippetEditorOptions,
  SnippetEditorTab,
  SnippetFrame,
  SnippetTerminal,
} from '@codeimage/prisma-models';

type IdAndProjectId = 'id' | 'projectId';

export interface ProjectCreateRequest {
  name: Project['name'];
  editorOptions: Omit<SnippetEditorOptions, IdAndProjectId>;
  terminal: Omit<SnippetTerminal, IdAndProjectId>;
  frame: Omit<SnippetFrame, IdAndProjectId>;
  editors: (Omit<SnippetEditorTab, IdAndProjectId | 'marks'> & {
    marks?: TabMarks;
  })[];
}

export type ProjectCreateResponse = Project & {
  editorOptions: SnippetEditorOptions;
  terminal: SnippetTerminal;
  frame: SnippetFrame;
  editorTabs: EditorTabResponse[];
};
