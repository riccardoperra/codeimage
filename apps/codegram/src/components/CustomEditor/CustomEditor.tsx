import {CodeMirror} from 'solid-codemirror';
import {createSignal} from 'solid-js';
import {EditorView} from '@codemirror/view';

export const CustomEditor = () => {
  const [value, setValue] = createSignal(new Array(1000).fill('a').join(''));
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
      extensions={[baseTheme, supportsLineWrap]}
      editable={true}
      basicSetup={true}
      onChange={setValue}
    />
  );
};
