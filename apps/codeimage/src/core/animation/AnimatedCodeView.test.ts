import assert from 'node:assert/strict';
import {draculaTheme} from '@codeimage/highlight/dracula';
import {tokenize} from '@core/snapshot/tokenize';
import {createComponent} from 'solid-js';
import {renderToString} from 'solid-js/web';
import {test} from 'vitest';
import AnimatedCodeView from '../../components/CustomEditor/AnimatedCodeView';
import {compileScene} from './compile';
import {pairScene} from './pair';
import {descendants, parseHtml, styleAt, type Element} from './test-utils';

const step = async (code: string) => ({
  lines: await tokenize(code, 'typescript', draculaTheme),
  marks: {lines: [], focusedLines: []},
  lineNumberStart: 1,
});

test('draws each visible token once, slides the kept ones, and fades in the new ones', async () => {
  const scene = pairScene(
    await step('const a = 1;'),
    await step('let b;\nconst a = 1;'),
    true,
  );
  const {html, css} = compileScene(
    scene,
    {charWidth: 8, lineHeight: 20},
    {transitionMs: 900, easing: 'linear'},
    'a',
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
  assert.ok(markup.includes('data-animated-code-view'));
  assert.ok(markup.includes('data-line-focus="false"'));

  const elements = descendants(parseHtml(markup));
  const within = (className: string) =>
    descendants(
      elements.find(element =>
        element.attributes.class?.split(' ').includes(className),
      )!,
    ).filter(element => element.text);
  const texts = (tokens: Element[]) => tokens.map(token => token.text).sort();
  const pose = (token: Element, timeMs: number) => {
    const {top, opacity = 1} = styleAt(token, css, timeMs);
    return {top, opacity};
  };
  const tokens = within('cm-content');
  assert.deepEqual(texts(tokens), [
    '1',
    ';',
    ';',
    '=',
    'a',
    'b',
    'const',
    'let',
  ]);
  const slid = tokens.filter(
    token => pose(token, 0).top === 0 && pose(token, 900).top === 20,
  );
  assert.deepEqual(texts(slid), ['1', ';', '=', 'a', 'const']);
  for (const token of slid) assert.equal(pose(token, 450).top, 10);
  const entered = tokens.filter(token => pose(token, 0).opacity === 0);
  assert.deepEqual(texts(entered), [';', 'b', 'let']);
  for (const token of entered) assert.equal(pose(token, 900).opacity, 1);
  assert.deepEqual(texts(within('cm-gutters')), ['1', '2']);
});
