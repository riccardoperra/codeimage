import {EditorView} from '@codemirror/view';
import {useEditorState} from '../../state/editor';
import {useStaticConfiguration} from '../../core/configuration';
import {createMemo, createResource, Show} from 'solid-js';
import {lineNumbers} from '@codemirror/gutter';
import {createCustomFontExtension} from './custom-font-extension';
import {CodeMirror} from 'solid-codemirror';
import {EDITOR_BASE_SETUP} from '@codeimage/config';
import clsx from 'clsx';

export const CustomEditor = () => {
  const configuration = useStaticConfiguration();
  const editor = useEditorState();

  const selectedLanguage = createMemo(() =>
    configuration.languages.find(language => language.id === editor.languageId),
  );

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

  const themeConfiguration = createMemo(() =>
    configuration.themes.find(theme => theme.id === editor.themeId),
  );

  const currentTheme = createMemo(
    () => themeConfiguration()?.editorTheme || [],
  );

  const supportsLineWrap = EditorView.lineWrapping;

  const baseTheme = EditorView.theme({
    '&': {
      textAlign: 'left',
      background: 'transparent',
    },
    '.cm-content': {
      textAlign: 'left',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
    },
  });

  const customFontExtension = createMemo(() =>
    createCustomFontExtension({
      fontName:
        configuration.fonts.find(({id}) => editor.fontId === id)?.name ||
        configuration.fonts[0].name,
      fontWeight: editor.fontWeight,
    }),
  );

  return (
    <Show
      when={themeConfiguration()}
      fallback={'Error loading editor configuration'}
    >
      <code
        class={clsx(
          themeConfiguration()!.externalStylesheet?.parentClass,
          `language-${selectedLanguage()?.id ?? 'default'}`,
        )}
      >
        <CodeMirror
          className={themeConfiguration()!.externalStylesheet?.className}
          value={editor.code}
          onChange={editor.setCode}
          extensions={[
            EDITOR_BASE_SETUP,
            baseTheme,
            supportsLineWrap,
            customFontExtension(),
            currentLanguage() || [],
            currentTheme(),
            editor.showLineNumbers ? lineNumbers() : [],
          ]}
          basicSetup={false}
          editable={true}
        />
      </code>
    </Show>
  );
};
