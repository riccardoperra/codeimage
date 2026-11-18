import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {EditorView} from '@codemirror/view';
import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorReadonly,
} from 'solid-codemirror';
import {createMemo, untrack} from 'solid-js';
import {SUPPORTED_FONTS} from '../../src/core/configuration/font';
import {THEME_REGISTRY} from '../../src/state/theme/themeRegistry';

interface CustomEditorPreviewProps {
  themeId: string;
  languageId: string;
  code: string;
}

const baseTheme = EditorView.theme({
  '&': {
    textAlign: 'left',
    fontSize: '11px',
    background: 'transparent',
    userSelect: 'none',
  },
  '.cm-gutters': {backgroundColor: 'transparent', border: 'none'},
  '.cm-line': {padding: '0 2px 0 8px'},
  '.cm-content *': {
    fontFamily: `${SUPPORTED_FONTS[0].name}, monospace`,
    fontWeight: 400,
    fontVariantLigatures: 'normal',
  },
});

async function loadLanguage(id: string) {
  return SUPPORTED_LANGUAGES.find(entry => entry.id === id)?.plugin();
}

async function loadTheme(id: string) {
  const entry =
    THEME_REGISTRY.find(entry => entry.id === id) ?? THEME_REGISTRY[0];
  return (await entry?.load())?.editorTheme;
}

export default function CustomEditorPreview(props: CustomEditorPreviewProps) {
  const language = createMemo(() => loadLanguage(props.languageId));
  const theme = createMemo(() => loadTheme(props.themeId));

  const {ref, editorView, createExtension} = createCodeMirror({
    value: untrack(() => props.code),
    extensions: [
      baseTheme,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({'aria-label': 'codeimage-editor'}),
    ],
  });
  createEditorControlledValue(editorView, () => props.code, {notify: false});
  createEditorReadonly(editorView, () => true);
  createExtension(() => language());
  createExtension(() => theme());

  return <div aria-readonly="true" ref={ref} />;
}
