import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {Extension} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorReadonly,
} from 'solid-codemirror';
import {
  createEffect,
  createMemo,
  createResource,
  on,
  onMount,
  VoidProps,
} from 'solid-js';
import {supportsLineWrap} from './supportsLineWrap';

interface CustomEditorPreviewProps {
  themeId: string;
  languageId: string;
  code: string;
}

export default function CustomEditorPreview(
  props: VoidProps<CustomEditorPreviewProps>,
) {
  let editorEl!: HTMLDivElement;
  const {themeArray: themes} = getThemeStore();
  const languages = SUPPORTED_LANGUAGES;
  const fonts = SUPPORTED_FONTS;

  const {editorView, ref: setEditorRef, createExtension} = createCodeMirror();
  createEditorControlledValue(editorView, () => props.code);
  createEditorReadonly(editorView, () => true);

  const selectedLanguage = createMemo(() =>
    languages.find(language => language.id === props.languageId),
  );

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

  const themeConfiguration = createMemo(
    () =>
      themes().find(theme => theme()?.id === props.themeId)?.() ??
      themes()[0]?.(),
  );

  const currentTheme = () => themeConfiguration()?.editorTheme || [];

  const previewEditorBaseTheme = () =>
    EditorView.theme({
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
      '.cm-content *': {
        fontFamily: `${fonts[0].name}, monospace`,
        fontWeight: 400,
        fontVariantLigatures: 'normal',
      },
    });

  const extensions = (): Extension => [
    previewEditorBaseTheme(),
    supportsLineWrap,
    currentLanguage() || [],
    currentTheme(),
  ];

  // eslint-disable-next-line solid/reactivity
  const reconfigure = createExtension(extensions());

  onMount(() => {
    setEditorRef(editorEl);
    import('./fix-cm-aria-roles-lighthouse').then(m =>
      m.fixCodeMirrorAriaRole(() => editorEl),
    );
  });

  createEffect(on(extensions, extensions => reconfigure(extensions)));

  return <div aria-readonly={true} ref={editorEl} />;
}
