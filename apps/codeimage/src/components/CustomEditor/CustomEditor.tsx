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
  EditorView,
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import {createCodeMirror, createEditorReadonly} from 'solid-codemirror';
import {
  VoidProps,
  createEffect,
  createMemo,
  createResource,
  on,
} from 'solid-js';
import {createTabIcon} from '../../hooks/use-tab-icon';
import {diffMarkerControl} from './plugins/diff/extension';

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
  onEditorViewChange?: (view: EditorView | undefined) => void;
  onValueChange?: (value: string) => void;
  dispatchTransaction: boolean;
}

export default function CustomEditor(props: VoidProps<CustomEditorProps>) {
  const {themeArray: themes} = getThemeStore();
  const languages = SUPPORTED_LANGUAGES;
  const {
    state: editorState,
    canvasEditorEvents,
    computed: {selectedFont},
  } = getRootEditorStore();
  const {editor} = getActiveEditorStore();
  const selectedLanguage = createMemo(() =>
    languages.find(language => language.id === editor()?.languageId),
  );

  const {
    editorView,
    ref: setRef,
    createExtension,
  } = createCodeMirror({
    value: editor()?.code,
    onTransactionDispatched: props.dispatchTransaction
      ? tr => canvasEditorEvents.emit(tr)
      : undefined,
    onValueChange: props.onValueChange,
  });

  createEffect(() => props.onEditorViewChange?.(editorView()));

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

  const icon = createTabIcon(
    () => editor()?.tab.tabName ?? null,
    () => editor()?.languageId ?? '',
    true,
  );

  const [currentExtraLanguage] = createResource(icon, iconDef => {
    return iconDef?.extraLanguage?.() ?? [];
  });

  const themeConfiguration = createMemo(
    () =>
      themes().find(theme => theme()?.id === editorState.options.themeId)?.() ??
      themes()[0](),
  );

  const baseTheme = EditorView.theme({
    '&': {
      textAlign: 'left',
      background: 'transparent !important',
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
    },
  });

  const customFontExtension = (): Extension => {
    const font = selectedFont();
    const fontName = font.name,
      fontWeight = editorState.options.fontWeight,
      enableLigatures = editorState.options.enableLigatures;

    const fontVariantLigatures = !!enableLigatures ? 'normal' : 'none';

    return EditorView.theme({
      '.cm-content *': {
        fontFamily: `${fontName}, monospace`,
        fontWeight: fontWeight,
        fontVariantLigatures,
      },
      '.cm-gutters': {
        fontFamily: `${fontName}, monospace`,
        fontWeight: 400,
        fontVariantLigatures,
      },
    });
  };

  createEditorReadonly(editorView, () => props.readOnly);
  createExtension(EditorView.lineWrapping);
  createExtension(() =>
    EditorView.contentAttributes.of({
      'aria-label': 'codeimage-editor',
    }),
  );
  createExtension(() => customFontExtension());
  createExtension(currentLanguage);
  createExtension(currentExtraLanguage);

  createExtension(() =>
    editorState.options.showDiffMode
      ? diffMarkerControl({readOnly: props.readOnly})
      : [],
  );
  createExtension(() => {
    return editorState.options.showLineNumbers ? lineNumbers() : [];
  });
  createExtension(() => themeConfiguration()?.editorTheme || []);
  createExtension(baseTheme);

  const reconfigureBaseSetup = createExtension(EDITOR_BASE_SETUP);

  createEffect(
    on(
      () => props.readOnly,
      readOnly => {
        const extension = readOnly ? [] : EDITOR_BASE_SETUP;
        reconfigureBaseSetup(extension);
      },
    ),
  );

  return (
    <code class={`language-${selectedLanguage()?.id ?? 'default'}`}>
      <div ref={setRef} />
    </code>
  );
}
