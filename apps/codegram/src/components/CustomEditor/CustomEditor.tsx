import {EditorView} from '@codemirror/view';
import {javascript} from '@codemirror/lang-javascript';
import {CodeMirror} from 'solid-codemirror';
import {code$, setCode} from '../../state/code.state';
import {observe} from '../../state/observe';

export const CustomEditor = () => {
  const code = observe(code$);

  const supportsLineWrap = EditorView.lineWrapping;
  const baseTheme = EditorView.theme({
    '&': {
      fontFamily: 'Source Code Pro, monospace',
      textAlign: 'left',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
      color: 'black',
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
        value={code()}
        onChange={value => setCode(value)}
        extensions={[baseTheme, supportsLineWrap, javascript()]}
        editable={true}
        basicSetup={true}
      />
    </>
  );
};
