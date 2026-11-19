import {createComponent} from 'solid-js';
import {renderToString} from '@solidjs/web';
import {expect, test} from 'vitest';
import {draculaTheme} from '@codeimage/highlight/dracula';
import StaticCodeView from '../../components/CustomEditor/StaticCodeView';

function render(focusedLines: number[]) {
  return renderToString(() =>
    createComponent(StaticCodeView, {
      code: 'one\ntwo\nthree\nfour\nfive',
      marks: {lines: [{line: 2, kind: 'added'}], focusedLines},
      languageId: 'text',
      language: null,
      theme: draculaTheme,
      showLineNumbers: true,
      lineNumberStart: 1,
      fontFamily: 'monospace',
      fontWeight: 400,
      enableLigatures: false,
    }),
  );
}

test('keeps two separate focus ranges sharp independently of color marks', () => {
  const html = render([1, 2, 4, 5]);
  expect(html).toContain('data-line-focus="true"');
  expect((html.match(/data-focused="true"/g) ?? []).length).toBe(4);
  expect((html.match(/cm-gutterElement cm-lineMarkDim/g) ?? []).length).toBe(1);
});

test('clearing one range keeps the other and clearing all disables dimming', () => {
  expect(render([4, 5])).toContain('data-line-focus="true"');
  expect(render([])).toContain('data-line-focus="false"');
  expect(render([])).not.toContain('cm-lineMarkDim');
});
