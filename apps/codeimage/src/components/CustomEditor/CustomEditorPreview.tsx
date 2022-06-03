import {SUPPORTED_LANGUAGES, SUPPORTED_THEMES} from '@codeimage/config';
import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {EditorView} from '@codemirror/view';
import {createCodeMirror} from 'solid-codemirror';
import {
  batch,
  createEffect,
  createMemo,
  createResource,
  onCleanup,
  onMount,
  VoidProps,
} from 'solid-js';
import {SUPPORTED_FONTS} from '../../core/configuration/font';
import {createCustomFontExtension} from './custom-font-extension';

interface CustomEditorPreviewProps {
  themeId: string;
  languageId: string;
  code: string;
}

// TODO: create a `runMode` plugin like cm5

export const CustomEditorPreview = (
  props: VoidProps<CustomEditorPreviewProps>,
) => {
  let editorEl!: HTMLDivElement;
  const themes = SUPPORTED_THEMES;
  const languages = SUPPORTED_LANGUAGES;
  const fonts = SUPPORTED_FONTS;
  const {options: editorOptions} = getRootEditorStore();

  const selectedLanguage = createMemo(() =>
    languages.find(language => language.id === props.languageId),
  );

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

  const themeConfiguration = createMemo(
    () => themes.find(theme => theme.id === props.themeId) ?? themes[0],
  );

  const currentTheme = () => themeConfiguration()?.editorTheme || [];

  const supportsLineWrap = EditorView.lineWrapping;

  const baseTheme = EditorView.theme({
    '&': {
      textAlign: 'left',
      fontSize: '11px',
      background: 'transparent',
      userSelect: 'none',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
    },
    '.cm-line': {
      padding: '0 2px 0 8px',
    },
  });

  setTimeout(() => {
    const content = document.querySelector('.cm-content');
    if (!content) {
      return;
    }

    /**
     * **🚀 Seo tip: fix invalid aria roles for CodeMirror**
     */
    content.setAttribute('id', 'codeEditor');
    content.setAttribute('aria-label', 'codeimage-editor');
    content.removeAttribute('aria-expanded');
  });

  const customFontExtension = () =>
    createCustomFontExtension({
      fontName:
        fonts.find(({id}) => editorOptions.fontId === id)?.name ||
        fonts[0].name,
      // TODO editor fix type never null
      fontWeight: editorOptions.fontWeight ?? 400,
    });

  const {view, setOptions, setContainer} = createCodeMirror({
    container: editorEl,
    editable: false,
    extensions: [],
    'aria-readonly': 'true',
  });

  onMount(() => setContainer(editorEl));

  createEffect(() =>
    batch(() => {
      // @ts-expect-error Deep type
      setOptions({
        value: props.code,
        extensions: [
          customFontExtension(),
          baseTheme,
          supportsLineWrap,
          currentTheme(),
          currentLanguage()!,
        ],
      });
    }),
  );

  onCleanup(() => view()?.destroy());

  return <div ref={ref => (editorEl = ref)} class={`solid-cm`} />;
};
