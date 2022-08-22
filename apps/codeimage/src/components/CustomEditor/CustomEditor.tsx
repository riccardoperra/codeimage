import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
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
  createEditorReadonly,
} from 'solid-codemirror';
import {
  createEffect,
  createMemo,
  createResource,
  getOwner,
  on,
  onMount,
  runWithOwner,
  VoidProps,
} from 'solid-js';

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

interface CustomEditorProps {
  readOnly: boolean;
}

export default function CustomEditor(props: VoidProps<CustomEditorProps>) {
  let editorEl!: HTMLDivElement;
  const {themeArray: themes} = getThemeStore();
  const languages = SUPPORTED_LANGUAGES;
  const fonts = SUPPORTED_FONTS;
  const owner = getOwner();

  const {
    state: editorState,
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
      themes().find(theme => theme()?.id === editorState.options.themeId)?.() ??
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
        fonts.find(({id}) => editorState.options.fontId === id)?.name ||
        fonts[0].name,
      fontWeight: editorState.options.fontWeight,
    });

  onMount(() => {
    setRef(editorEl);
    import('./fix-cm-aria-roles-lighthouse').then(m => {
      if (!owner) return;
      runWithOwner(owner, () => m.fixCodeMirrorAriaRole(() => editorEl));
    });
  });

  const {setFocused: editorSetFocused} = createEditorFocus(
    editorView,
    setFocused,
  );

  createEditorControlledValue(editorView, () => editor()?.code ?? '');
  createEditorReadonly(editorView, () => props.readOnly);
  createExtension(EditorView.lineWrapping);
  createExtension(customFontExtension);
  createExtension(currentLanguage);
  createExtension(() =>
    editorState.options.showLineNumbers ? lineNumbers() : [],
  );
  createExtension(() => themeConfiguration()?.editorTheme || []);
  createExtension(baseTheme);
  createExtension(EDITOR_BASE_SETUP);

  createEffect(
    on(editorView, view => {
      if (view) {
        createEffect(
          on(
            () => editorState.options.focused,
            isFocused => {
              if (view && !view.hasFocus && isFocused) {
                editorSetFocused(true);
              }
            },
          ),
        );
      }
    }),
  );

  return (
    <code class={`language-${selectedLanguage()?.id ?? 'default'}`}>
      <div ref={ref => (editorEl = ref)} />
    </code>
  );
}
