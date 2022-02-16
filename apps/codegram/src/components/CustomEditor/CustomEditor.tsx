import {EditorView} from '@codemirror/view';
import {javascript} from '@codemirror/lang-javascript';
import {CodeMirror} from 'solid-codemirror';
import {code$, setCode} from '../../state/code.state';
import {from} from 'solid-js';
import {extensions$} from '../../state/frame.state';

export const CustomEditor = () => {
  const code = from(code$);
  const extensions = from(extensions$);

  const supportsLineWrap = EditorView.lineWrapping;

  const baseTheme = EditorView.theme({
    '&': {
      fontFamily: 'Source Code Pro, monospace',
      textAlign: 'left',
      background: 'transparent',
    },
    '.cm-content': {
      fontFamily: 'Source Code Pro, monospace',
      textAlign: 'left',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
    },
  });

  return (
    <>
      <CodeMirror
        class={'cm-s-eclipse'}
        value={code()}
        onChange={value => setCode(value)}
        extensions={[
          baseTheme,
          supportsLineWrap,
          javascript({jsx: true, typescript: true}),
          extensions(),
        ]}
        editable={true}
        basicSetup={true}
      />
    </>
  );
};
