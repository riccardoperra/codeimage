import {EditorView} from '@codemirror/view';
import {CodeMirror} from 'solid-codemirror';
import {useEditorState} from '../../state/editor';
import {useStaticConfiguration} from '../../core/configuration';
import {createMemo, createResource} from 'solid-js';

export const CustomEditor = () => {
  const configuration = useStaticConfiguration();
  const editor = useEditorState();

  const selectedLanguage = createMemo(() =>
    configuration.languages.find(language => language.id === editor.languageId),
  );

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

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
          editor.extensions,
          currentLanguage() || [],
        ]}
        editable={true}
        basicSetup={true}
      />
    </>
  );
};
