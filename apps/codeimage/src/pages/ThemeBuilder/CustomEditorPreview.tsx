import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {CustomTheme} from '@codeimage/highlight';
import {fleetDarkTheme} from '@codeimage/highlight/fleetDark';
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

interface CustomEditorPreviewProps {
  theme: CustomTheme;
  languageId: string;
  code: string;
}

export default function CustomEditorPreview(
  props: VoidProps<CustomEditorPreviewProps>,
) {
  let editorEl!: HTMLDivElement;
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

  const previewEditorBaseTheme = () =>
    EditorView.theme({
      '&': {
        textAlign: 'left',
        fontSize: '16px',
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
    props.theme.editorTheme,
    EditorView.lineWrapping,
    currentLanguage() || [],
    fleetDarkTheme.editorTheme,
    EditorView.contentAttributes.of({
      'aria-label': 'codeimage-editor',
    }),
  ];

  // eslint-disable-next-line solid/reactivity
  const reconfigure = createExtension(extensions());

  onMount(() => {
    setEditorRef(() => editorEl);
  });

  createEffect(on(extensions, extensions => reconfigure(extensions)));

  return <div aria-readonly={true} ref={editorEl} />;
}
