import {createSignal} from 'solid-js';
import {EditorView} from '@codemirror/view';
import {javascript} from '@codemirror/lang-javascript';
import {CodeMirror} from 'solid-codemirror';

import {HighlightStyle, tags} from '@codemirror/highlight';

const myHighlightStyle = HighlightStyle.define([
  {tag: tags.keyword, color: '#fc6'},
  {tag: tags.comment, color: '#f5d', fontStyle: 'italic'},
]);

export const CustomEditor = () => {
  const [value, setValue] = createSignal(
    'class name {\n' + '  constructor(params) {\n' + '    \n' + '  }\n' + '}',
  );
  let ref: HTMLDivElement;
  const supportsLineWrap = EditorView.lineWrapping;
  const baseTheme = EditorView.theme(
    {
      '&': {
        fontFamily: 'Source Code Pro, monospace',
      },
      '.cm-activeLine': {
        backgroundColor: 'transparent',
        color: 'white',
      },
      '.cm-content': {
        fontFamily: 'Source Code Pro, monospace',
        textAlign: 'left',
      },
      '.cm-gutters': {
        display: 'none',
      },
    },
    {dark: true},
  );

  return (
    <CodeMirror
      value={value()}
      onChange={setValue}
      extensions={[baseTheme, supportsLineWrap, javascript()]}
      editable={true}
      basicSetup={true}
    />
  );
};
