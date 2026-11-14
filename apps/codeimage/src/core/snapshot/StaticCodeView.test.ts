import assert from 'node:assert/strict';
import {draculaTheme} from '@codeimage/highlight/dracula';
import {createComponent} from 'solid-js';
import {renderToString} from 'solid-js/web';
import {test} from 'vitest';
import StaticCodeView from '../../components/CustomEditor/StaticCodeView';
import {loadLanguage} from './tokenize';

const props = {
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
  assert.ok(html.includes('cm-gutterElement">42<'));
  assert.ok(html.includes('cm-gutterElement">341<'));
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
