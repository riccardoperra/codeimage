import {inferLanguageFromPath} from '@codeimage/config';
import type {DiffFile} from '../../../../core/diff/parseUnifiedDiff';
import {getInitialEditorState} from '../../../../state/editor/editor';
import {createUniqueId} from '../../../../state/plugins/unique-id';
import type {DiffImportSnapshot} from './diffImportHistory';

/** The tabs after importing a diff: the first file replaces the pasted tab, the others open new tabs. */
export function diffImportEditors(
  before: DiffImportSnapshot,
  files: DiffFile[],
  tabId: string | undefined,
  fallbackLanguageId: string,
): DiffImportSnapshot {
  const [first, ...rest] = files;
  const languageId = (path: string) =>
    inferLanguageFromPath(path) ?? fallbackLanguageId;
  return {
    activeEditorId: before.activeEditorId,
    editors: [
      ...before.editors.map(editor =>
        editor.id === tabId
          ? {
              ...editor,
              code: first.code,
              marks: first.marks,
              tab: {tabName: first.path},
              languageId: languageId(first.path),
            }
          : editor,
      ),
      ...rest.map(file => ({
        ...getInitialEditorState(),
        id: createUniqueId(),
        code: file.code,
        marks: file.marks,
        tab: {tabName: file.path},
        languageId: languageId(file.path),
      })),
    ],
  };
}
