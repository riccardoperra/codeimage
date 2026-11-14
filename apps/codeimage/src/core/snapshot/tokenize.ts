import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import type {CustomTheme} from '@codeimage/highlight';
import {highlightingFor, language, type Language} from '@codemirror/language';
import {EditorState, type Extension} from '@codemirror/state';
import {highlightCode} from '@lezer/highlight';

export interface TokenSpan {
  text: string;
  classes: string;
}

export type TokenLine = TokenSpan[];

type LanguageLoader = () => Promise<Extension>;

const languages = new Map<
  LanguageLoader | undefined,
  Promise<Language | null>
>();

// Resolves the parser the canvas editor uses. A tab name such as `App.vue` can override the language.
export function loadLanguage(
  languageId: string,
  tabName: string | null = null,
): Promise<Language | null> {
  const definition = SUPPORTED_LANGUAGES.find(
    language => language.id === languageId,
  );
  const extra = definition?.icons.findLast(icon =>
    icon.matcher.test(tabName ?? ''),
  )?.extraLanguage;
  const load = extra?.overrideParent ? extra.extension : definition?.plugin;
  let loaded = languages.get(load);
  if (!loaded) {
    loaded = Promise.resolve(load?.()).then(support =>
      EditorState.create({extensions: support ?? []}).facet(language),
    );
    languages.set(load, loaded);
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
    return source.split('\n').map(text => (text ? [{text, classes: ''}] : []));
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
  tabName: string | null = null,
): Promise<TokenLine[]> {
  return tokenizeCode(code, await loadLanguage(languageId, tabName), theme);
}
