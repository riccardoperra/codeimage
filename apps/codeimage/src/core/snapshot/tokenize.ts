import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import type {CustomTheme} from '@codeimage/highlight';
import {highlightingFor, language, type Language} from '@codemirror/language';
import {EditorState} from '@codemirror/state';
import {highlightCode} from '@lezer/highlight';

export interface TokenSpan {
  text: string;
  classes: string;
}

export type TokenLine = TokenSpan[];

const languages = new Map<string, Promise<Language | null>>();

export function loadLanguage(languageId: string): Promise<Language | null> {
  let loaded = languages.get(languageId);
  if (!loaded) {
    loaded = Promise.resolve(
      SUPPORTED_LANGUAGES.find(
        language => language.id === languageId,
      )?.plugin(),
    ).then(support =>
      EditorState.create({extensions: support ?? []}).facet(language),
    );
    languages.set(languageId, loaded);
  }
  return loaded;
}

export function tokenizeCode(
  code: string,
  parserLanguage: Language | null,
  theme: CustomTheme,
): TokenLine[] {
  const state = EditorState.create({doc: code, extensions: theme.editorTheme});
  const source = state.doc.toString();
  if (!parserLanguage)
    return source.split('\n').map(text => [{text, classes: ''}]);
  const lines: TokenLine[] = [];
  let line: TokenLine = [];
  // highlightingFor combines every active HighlightStyle, including theme overrides.
  highlightCode(
    source,
    parserLanguage.parser.parse(source),
    {style: tags => highlightingFor(state, tags)},
    (text, classes) => line.push({text, classes}),
    () => {
      lines.push(line);
      line = [];
    },
  );
  lines.push(line);
  return lines;
}

export async function tokenize(
  code: string,
  languageId: string,
  theme: CustomTheme,
): Promise<TokenLine[]> {
  return tokenizeCode(code, await loadLanguage(languageId), theme);
}
