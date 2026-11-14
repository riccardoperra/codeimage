import assert from 'node:assert/strict';
import {draculaTheme} from '@codeimage/highlight/dracula';
import {EditorView} from '@codemirror/view';
import {test} from 'vitest';
import {getStaticTheme} from '../../components/CustomEditor/staticTheme';

test('exports reusable CSS modules and scopes baseTheme rules on the static root', () => {
  const theme = {
    ...draculaTheme,
    editorTheme: [
      draculaTheme.editorTheme,
      EditorView.baseTheme({'.cm-line': {textDecoration: 'underline'}}),
    ],
  };
  const resolved = getStaticTheme(theme);
  assert.equal(getStaticTheme(theme), resolved);
  const rule = resolved.modules
    .flatMap(module => module.getRules().split('\n'))
    .find(rule => rule.includes('text-decoration: underline'));
  assert.ok(rule);
  const scope = rule.match(/\.(ͼ\w+)/)?.[1];
  assert.ok(scope && resolved.classes.split(' ').includes(scope));
});
