import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import type {EditorState} from '../state/editor/model';

export function altText(
  tab: Pick<EditorState, 'code' | 'tab' | 'languageId' | 'lineNumberStart'>,
): string {
  const language =
    SUPPORTED_LANGUAGES.find(language => language.id === tab.languageId)
      ?.label ?? tab.languageId;
  const name = tab.tab.tabName?.trim();
  const end = tab.lineNumberStart + tab.code.split(/\r\n|\r|\n/).length - 1;
  const header = [
    `${language} code`,
    name,
    `lines ${tab.lineNumberStart} to ${end}`,
  ]
    .filter(Boolean)
    .join(', ');
  const characters = Array.from(`${header}\n\n${tab.code}`);
  const note = '\n[Code truncated]';
  return characters.length <= 1000
    ? characters.join('')
    : characters.slice(0, 1000 - note.length).join('') + note;
}
