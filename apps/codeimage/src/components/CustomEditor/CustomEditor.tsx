import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {getActiveEditorStore} from '@codeimage/store/editor/createActiveEditor';
import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import {bracketMatching, indentOnInput} from '@codemirror/language';
import {EditorState, Extension} from '@codemirror/state';
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorFocus,
} from 'solid-codemirror';
import {createMemo, createResource, onMount} from 'solid-js';

interface CustomFontExtensionOptions {
  fontName: string;
  fontWeight: number;
}

const EDITOR_BASE_SETUP: Extension = [
  highlightSpecialChars(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  history(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...completionKeymap,
    ...historyKeymap,
    indentWithTab,
  ]),
];

export default function CustomEditor() {
  let editorEl!: HTMLDivElement;
  const {themeArray: themes} = getThemeStore();
  const languages = SUPPORTED_LANGUAGES;
  const fonts = SUPPORTED_FONTS;

  const {
    options: editorOptions,
    actions: {setFocused},
  } = getRootEditorStore();
  const {editor, setCode} = getActiveEditorStore();
  const selectedLanguage = createMemo(() =>
    languages.find(language => language.id === editor()?.languageId),
  );

  const {
    editorView,
    ref: setRef,
    createExtension,
  } = createCodeMirror({
    value: editor()?.code,
    onValueChange: setCode,
  });

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

  const themeConfiguration = createMemo(
    () =>
      themes().find(theme => theme()?.id === editorOptions.themeId)?.() ??
      themes()[0](),
  );

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
      border: 'none',
    },
    '.cm-lineNumbers': {
      position: 'sticky',
      flexDirection: 'column',
      flexShrink: 0,
    },
    '.cm-lineNumbers .cm-gutterElement': {
      textAlign: 'right',
      padding: '0 16px 0 8px',
      lineHeight: '21px',
    },
    '.cm-line': {
      padding: '0 2px 0 8px',
    },
    '.cm-cursor': {
      borderLeftWidth: '2px',
      height: '21px',
      transform: 'translateY(-10%)',
    },
  });

  const createCustomFontExtension = (
    options: CustomFontExtensionOptions,
  ): Extension => {
    return EditorView.theme({
      '.cm-content *': {
        fontFamily: `${options.fontName}, monospace`,
        fontWeight: options.fontWeight,
        fontVariantLigatures: 'normal',
      },
      '.cm-gutters': {
        fontFamily: `${options.fontName}, monospace`,
        fontWeight: 400,
        fontVariantLigatures: 'normal',
      },
    });
  };

  const customFontExtension = () =>
    createCustomFontExtension({
      fontName:
        fonts.find(({id}) => editorOptions.fontId === id)?.name ||
        fonts[0].name,
      fontWeight: editorOptions.fontWeight,
    });

  onMount(() => {
    setRef(editorEl);
    import('./fix-cm-aria-roles-lighthouse').then(m =>
      m.fixCodeMirrorAriaRole(() => editorEl),
    );
  });

  createEditorFocus(editorView, setFocused);
  createEditorControlledValue(editorView, () => editor()?.code ?? '');
  createExtension(EditorView.lineWrapping);
  createExtension(customFontExtension);
  createExtension(currentLanguage);
  createExtension(() => (editorOptions.showLineNumbers ? lineNumbers() : []));
  createExtension(() => themeConfiguration()?.editorTheme || []);
  createExtension(baseTheme);
  createExtension(EDITOR_BASE_SETUP);

  return (
    <code class={`language-${selectedLanguage()?.id ?? 'default'}`}>
      <div ref={ref => (editorEl = ref)} />
    </code>
  );
}
