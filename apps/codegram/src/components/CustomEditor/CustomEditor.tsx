import {createSignal} from 'solid-js';
import {EditorView} from '@codemirror/view';
import {javascript} from '@codemirror/lang-javascript';
import {CodeMirror} from 'solid-codemirror';

export const CustomEditor = () => {
  const [value, setValue] = createSignal(
    `
    export function Test() {
  return (
    <>
      <CodeMirror
        class={'cm-s-eclipse'}
        value={value()}
        onChange={setValue}
        extensions={[baseTheme, supportsLineWrap, javascript()]}
        editable={true}
        basicSetup={true}
      />
    </>
  );
};

    `,
  );
  const supportsLineWrap = EditorView.lineWrapping;
  const baseTheme = EditorView.theme({
    '&': {
      fontFamily: 'Source Code Pro, monospace',
      textAlign: 'left',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
      color: 'white',
    },
    '.cm-content': {
      fontFamily: 'Source Code Pro, monospace',
      textAlign: 'left',
    },
    // '.cm-gutters': {
    //   display: 'none',
    // },
  });

  return (
    <>
      <CodeMirror
        class={'cm-s-eclipse'}
        value={value()}
        onChange={setValue}
        extensions={[baseTheme, supportsLineWrap, javascript()]}
        editable={true}
        basicSetup={true}
      />
    </>
  );
};
