import {EditorView} from '@codemirror/view';
import {CodeMirror} from 'solid-codemirror';
import {useEditorState} from '../../state/editor';
import {useStaticConfiguration} from '../../core/configuration';
import {createMemo, createResource} from 'solid-js';
import {EDITOR_BASE_SETUP} from '@codeimage/config';
import {lineNumbers} from '@codemirror/gutter';

export const CustomEditor = () => {
  const configuration = useStaticConfiguration();
  const editor = useEditorState();

  const selectedLanguage = createMemo(() =>
    configuration.languages.find(language => language.id === editor.languageId),
  );

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

  const currentTheme = createMemo(() => {
    return (
      configuration.themes.find(theme => theme.id === editor.themeId)
        ?.editorTheme || []
    );
  });

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
        value={editor.code}
        onChange={editor.setCode}
        extensions={[
          EDITOR_BASE_SETUP,
          baseTheme,
          supportsLineWrap,
          currentLanguage() || [],
          currentTheme(),
          editor.showLineNumbers ? lineNumbers() : [],
        ]}
        basicSetup={false}
        editable={true}
      />
    </>
  );
};
