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

interface EditorUpdateRequest {
  id: NonNullable<SnippetEditorTab['id']>;
  code: NonNullable<SnippetEditorTab['code']>;
  languageId: NonNullable<SnippetEditorTab['languageId']>;
  tabName: NonNullable<SnippetEditorTab['tabName']>;
  lineNumberStart: NonNullable<SnippetEditorTab['lineNumberStart']>;
  marks?: TabMarks | null;
}

export interface ProjectUpdateRequest {
  editorOptions: Omit<SnippetEditorOptions, IdAndProjectId>;
  terminal: Omit<SnippetTerminal, IdAndProjectId>;
  frame: Omit<
    SnippetFrame,
    | IdAndProjectId
    | 'exportTarget'
    | 'aspectRatio'
    | 'signatureHandle'
    | 'signaturePosition'
  > &
    Partial<
      Pick<
        SnippetFrame,
        'exportTarget' | 'aspectRatio' | 'signatureHandle' | 'signaturePosition'
      >
    >;
  editors: EditorUpdateRequest[];
}

export type ProjectUpdateResponse = Project & {
  editorOptions: SnippetEditorOptions;
  terminal: SnippetTerminal;
  frame: SnippetFrame;
  editorTabs: EditorTabResponse[];
};
