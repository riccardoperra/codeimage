import type {SnippetEditorTab} from '@codeimage/prisma-models';
import type {TabMarks} from '../../../schemas/marks.js';

export type EditorTabResponse = Omit<SnippetEditorTab, 'marks'> & {
  marks: TabMarks;
};
