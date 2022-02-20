import {EditorView} from '@codemirror/view';
import {javascript} from '@codemirror/lang-javascript';
import {CodeMirror} from 'solid-codemirror';
import {useEditorState} from '../../state/editor';

export const CustomEditor = () => {
  const editor = useEditorState();

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

  // TODO: MUST CONFIGURE BASIC SETUP

  return (
    <>
      <CodeMirror
        class={'cm-s-eclipse'}
        value={editor.code}
        onChange={editor.setCode}
        extensions={[
          baseTheme,
          supportsLineWrap,
          javascript({jsx: true, typescript: true}),
          editor.extensions,
        ]}
        editable={true}
        basicSetup={false}
      />
    </>
  );
};
