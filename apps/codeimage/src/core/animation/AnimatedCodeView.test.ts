import assert from 'node:assert/strict';
import {draculaTheme} from '@codeimage/highlight/dracula';
import {tokenize} from '@core/snapshot/tokenize';
import {createComponent} from 'solid-js';
import {renderToString} from 'solid-js/web';
import {test} from 'vitest';
import AnimatedCodeView from '../../components/CustomEditor/AnimatedCodeView';
import {compileScene} from './compile';
import {pairScene} from './pair';

const step = async (code: string) => ({
  lines: await tokenize(code, 'typescript', draculaTheme),
  marks: {lines: [], focusedLines: []},
  lineNumberStart: 1,
});

test('renders one span per visible token and one keyframes rule per move', async () => {
  // `const a = 1;` has five tokens, and the new first line adds three.
  const scene = pairScene(
    await step('const a = 1;'),
    await step('let b;\nconst a = 1;'),
    true,
  );
  const {html, css} = compileScene(
    scene,
    {charWidth: 8, lineHeight: 20},
    {transitionMs: 900, easing: 'smooth'},
  );
  const markup = renderToString(() =>
    createComponent(AnimatedCodeView, {
      html,
      languageId: 'typescript',
      theme: draculaTheme,
      fontFamily: 'Jetbrains Mono',
      fontWeight: 400,
      enableLigatures: true,
    }),
  );
  const tokens = [
    ...markup
      .slice(markup.indexOf('cm-content'))
      .matchAll(/white-space:pre[^"]*">([^<]*)<\/span>/g),
  ].map(match => match[1]);
  assert.deepEqual(tokens.toSorted(), [
    '1',
    ';',
    ';',
    '=',
    'a',
    'b',
    'const',
    'let',
  ]);
  assert.equal(css.match(/@keyframes [^{]+\{from\{left/g)?.length, 5);
  assert.ok(markup.includes('data-animated-code-view'));
  assert.ok(markup.includes('data-line-focus="false"'));
  assert.ok(markup.includes('>2</span>'), 'renders the new line number');
});
