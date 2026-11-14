import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import type {EditorState} from '../state/editor/model';

const LIMIT = 1000;
const NOTE = '\n[Code truncated]';
// Prose spelling where the picker label differs, without renaming the picker.
const DISPLAY_NAMES: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  css: 'CSS',
  scss: 'SCSS',
  html: 'HTML',
  yaml: 'YAML',
  'plain-text': 'Plain text',
};

export function altText(
  tab: Pick<EditorState, 'code' | 'tab' | 'languageId' | 'lineNumberStart'>,
): string {
  const language =
    DISPLAY_NAMES[tab.languageId] ??
    SUPPORTED_LANGUAGES.find(language => language.id === tab.languageId)
      ?.label ??
    tab.languageId;
  const start = tab.lineNumberStart;
  const end = start + tab.code.split(/\r\n|\r|\n/).length - 1;
  const header = [
    `${language} code`,
    tab.tab.tabName?.trim(),
    start === end ? `line ${start}` : `lines ${start} to ${end}`,
  ]
    .filter(Boolean)
    .join(', ');
  const text = `${header}\n\n${tab.code}`;
  // Count user-perceived characters so the cut never splits an emoji sequence.
  const characters: string[] = [];
  for (const {segment} of new Intl.Segmenter().segment(text)) {
    if (characters.push(segment) > LIMIT) {
      return characters.slice(0, LIMIT - NOTE.length).join('') + NOTE;
    }
  }
  return text;
}
