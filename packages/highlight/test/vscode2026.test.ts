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
    control: '#c586c0',
    modifier: '#569cd6',
    constantLanguage: '#569cd6',
    templateBrace: '#569cd6',
    arrow: '#ff7b72',
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
    control: '#af00db',
    modifier: '#0000ff',
    constantLanguage: '#0000ff',
    templateBrace: '#0000ff',
    arrow: '#cf222e',
    activeLine: '#EAEAEA40',
  },
];

const doc = [
  '// Preview',
  'const count: number = 42;',
  'async function greet() { if (count) await greet(); return "Hello"; }',
  'const label = () => `${null}`;',
  'class Store { static size = 1; }',
].join('\n');

for (const expected of themes) {
  const {theme} = expected;
  const state = EditorState.create({
    doc,
    extensions: [javascript({typescript: true, jsx: true}), theme.editorTheme],
  });
  const modules = state.facet(EditorView.styleModule);
  const css = modules.map(module => module.getRules()).join('\n');
  // CodeMirror mounts the facet's modules in reverse, so the first module with a rule for the token's classes wins.
  const colorOf = (classes: string) => {
    for (const module of modules)
      for (const name of classes.split(' ')) {
        const color = new RegExp(`\\.${name} \\{color: ([^;]+);`).exec(
          module.getRules(),
        )?.[1];
        if (color) return color.toLowerCase();
      }
  };

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
      ['function', 'keyword'],
      ['42', 'number'],
      ['greet', 'function'],
      ['"Hello"', 'string'],
      ['if', 'control'],
      ['return', 'control'],
      ['await', 'control'],
      ['async', 'modifier'],
      ['static', 'modifier'],
      ['null', 'constantLanguage'],
      ['${', 'templateBrace'],
      ['=>', 'arrow'],
    ] as const) {
      const className = rendered.get(token);
      assert.ok(className, `${token} is highlighted by the TypeScript parser`);
      assert.equal(
        colorOf(className),
        expected[key].toLowerCase(),
        `${token} renders as ${key}`,
      );
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
