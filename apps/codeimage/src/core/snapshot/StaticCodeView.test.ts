import assert from 'node:assert/strict';
import {draculaTheme} from '@codeimage/highlight/dracula';
import {createComponent} from 'solid-js';
import {renderToString} from 'solid-js/web';
import {test} from 'vitest';
import StaticCodeView from '../../components/CustomEditor/StaticCodeView';
import {loadLanguage} from './tokenize';

const props = {
  marks: {lines: [], focusedLines: []},
  languageId: 'typescript',
  theme: draculaTheme,
  showLineNumbers: true,
  lineNumberStart: 42,
  fontFamily: 'Jetbrains Mono',
  fontWeight: 400,
  enableLigatures: true,
};

test('renders all highlighted lines synchronously on the server without document', async () => {
  assert.equal(typeof document, 'undefined');
  const language = await loadLanguage('typescript');
  const code = Array.from(
    {length: 300},
    (_, index) => `const value${index + 1} = ${index + 1};`,
  ).join('\n');
  const html = renderToString(() =>
    createComponent(StaticCodeView, {...props, code, language}),
  );
  assert.equal((html.match(/class="cm-line"/g) ?? []).length, 300);
  assert.ok(html.includes('value300'));
  assert.ok(html.includes('>42<'));
  assert.ok(html.includes('>341<'));
  // CodeMirror sizes the gutter for line 999 of 300 lines, which is 1040 when numbering starts at 42.
  assert.ok(html.includes('visibility:hidden">1040<'));
  assert.ok(html.includes('data-static-code-view'));
});

test('renders plain text without a parser', () => {
  const html = renderToString(() =>
    createComponent(StaticCodeView, {
      ...props,
      code: '<plain>\t👋',
      language: null,
    }),
  );
  assert.ok(html.includes('&lt;plain>'));
  assert.ok(html.includes('👋'));
});

test('exports diff and highlight marks with focused code and gutter numbers', () => {
  const html = renderToString(() =>
    createComponent(StaticCodeView, {
      ...props,
      code: 'before\nafter\n\nunchanged',
      language: null,
      marks: {
        lines: [
          {line: 1, kind: 'removed'},
          {line: 2, kind: 'added'},
          {line: 3, kind: 'highlight'},
        ],
        focusedLines: [3],
      },
    }),
  );
  assert.ok(html.includes('data-line-marks="true"'));
  assert.ok(html.includes('data-line-focus="true"'));
  assert.ok(html.includes('data-line-diff="true"'));
  const lines = Array.from(
    html.matchAll(/<div(?=[^>]*class="cm-line")([^>]*)>/g),
  );
  assert.equal(lines.length, 4);
  assert.ok(lines[0][1].includes('data-mark="removed"'));
  assert.ok(lines[1][1].includes('data-mark="added"'));
  assert.ok(lines[2][1].includes('data-mark="highlight"'));
  assert.ok(!lines[3][1].includes('data-mark'));
  assert.ok(html.includes('data-line-numbers="true"'));
  const gutter = new Map(
    Array.from(
      html.matchAll(/class="cm-gutterElement([^"]*)"[^>]*>(\d+)</g),
      match => [Number(match[2]), match[1].trim().split(/\s+/)] as const,
    ),
  );
  assert.deepEqual(
    [...gutter].flatMap(([line, classes]) =>
      classes.includes('cm-lineMarkDim') ? [line] : [],
    ),
    [42, 43, 45],
  );
  // The mark band covers the line number too, so the row reads as one line.
  assert.deepEqual(
    [42, 43, 44, 45].map(line =>
      gutter.get(line)?.filter(name => name.startsWith('cm-lineMark-')),
    ),
    [
      ['cm-lineMark-removed'],
      ['cm-lineMark-added'],
      ['cm-lineMark-highlight'],
      [],
    ],
  );
});

test('highlight-only exports omit the sign column and work without a gutter', () => {
  const html = renderToString(() =>
    createComponent(StaticCodeView, {
      ...props,
      code: 'first\nlast',
      language: null,
      showLineNumbers: false,
      marks: {lines: [{line: 2, kind: 'highlight'}], focusedLines: []},
    }),
  );
  assert.ok(html.includes('data-line-diff="false"'));
  assert.ok(html.includes('data-line-focus="false"'));
  assert.ok(html.includes('data-mark="highlight"'));
  assert.ok(!html.includes('cm-gutterElement'));
});
