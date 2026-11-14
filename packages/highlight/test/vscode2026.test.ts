import assert from 'node:assert/strict';
import {test} from 'node:test';
import {javascript} from '@codemirror/lang-javascript';
import {highlightingFor, syntaxTree} from '@codemirror/language';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {highlightTree, tags} from '@lezer/highlight';
import {vsCodeDark2026Theme} from '../src/lib/themes/vsCodeDark2026';
import {vsCodeLight2026Theme} from '../src/lib/themes/vsCodeLight2026';

const themes = [
  {
    theme: vsCodeDark2026Theme,
    background: '#121314',
    foreground: '#BBBEBF',
    keyword: '#ff7b72',
    string: '#a5d6ff',
    comment: '#8b949e',
    function: '#d2a8ff',
    number: '#b5cea8',
    activeLine: '#242526',
  },
  {
    theme: vsCodeLight2026Theme,
    background: '#FFFFFF',
    foreground: '#202020',
    keyword: '#cf222e',
    string: '#0a3069',
    comment: '#6e7781',
    function: '#8250df',
    number: '#098658',
    activeLine: '#EAEAEA40',
  },
];

const doc =
  '// Preview\nconst count: number = 42;\nfunction greet() { return "Hello"; }\ngreet();';

for (const expected of themes) {
  const {theme} = expected;
  const state = EditorState.create({
    doc,
    extensions: [javascript({typescript: true, jsx: true}), theme.editorTheme],
  });
  const css = state
    .facet(EditorView.styleModule)
    .map(module => module.getRules())
    .join('\n');

  test(`${theme.id} uses the upstream editor background and foreground`, () => {
    assert.equal(theme.properties.terminal.main, expected.background);
    assert.equal(theme.properties.terminal.text, expected.foreground);
    assert.ok(css.includes(`{background-color: ${expected.background};}`));
    assert.ok(css.includes(`{color: ${expected.foreground};}`));
  });

  for (const [key, tag] of [
    ['keyword', tags.keyword],
    ['string', tags.string],
    ['comment', tags.comment],
    ['function', tags.function(tags.variableName)],
    ['number', tags.number],
  ] as const) {
    test(`${theme.id} renders ${key} with the upstream color`, () => {
      const className = highlightingFor(state, [tag]);
      assert.ok(className, `${key} has a syntax highlight class`);
      assert.ok(css.includes(`.${className} {color: ${expected[key]};}`));
    });
  }

  test(`${theme.id} applies the colors to parsed TypeScript`, () => {
    const rendered = new Map<string, string>();
    highlightTree(
      syntaxTree(state),
      {
        style: tokenTags => highlightingFor(state, tokenTags),
      },
      (from, to, classes) => {
        rendered.set(doc.slice(from, to), classes);
      },
    );
    for (const [token, key] of [
      ['// Preview', 'comment'],
      ['const', 'keyword'],
      ['42', 'number'],
      ['greet', 'function'],
      ['"Hello"', 'string'],
    ] as const) {
      const className = rendered.get(token);
      assert.ok(className, `${token} is highlighted by the TypeScript parser`);
      assert.ok(css.includes(`.${className} {color: ${expected[key]};}`));
    }
  });

  test(`${theme.id} retains its active line color`, () => {
    const activeLineRule = css
      .split('\n')
      .find(rule => rule.includes('.cm-activeLine'));
    assert.ok(
      activeLineRule?.endsWith(`{background-color: ${expected.activeLine};}`),
    );
  });
}
