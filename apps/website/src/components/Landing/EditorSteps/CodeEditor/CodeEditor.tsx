import {javascriptLanguage, jsxLanguage} from '@codemirror/lang-javascript';
import {EditorView} from '@codemirror/view';
import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorReadonly,
} from 'solid-codemirror';
import {onMount} from 'solid-js';

interface CodeEditorProps {
  code: string;
}

export function CodeEditor(props: CodeEditorProps) {
  let ref: HTMLDivElement;
  const {
    ref: setInternalRef,
    editorView,
    createExtension,
  } = createCodeMirror({
    value: props.code,
  });

  onMount(() => {
    document
      .querySelector('[data-defer-font=codemirror]')
      ?.removeAttribute('media');

    setInternalRef(() => ref);

    createExtension([jsxLanguage, javascriptLanguage]);
    createExtension(
      EditorView.theme({
        '.cm-content': {
          fontFamily: 'Jetbrains Mono',
        },
      }),
    );
    createEditorControlledValue(editorView, () => props.code);

    const reconfigureTheme = createExtension([]);
    import('@codeimage/highlight/synthwave84')
      .then(m => m.synthwave84Theme.editorTheme)
      .then(mod => reconfigureTheme(mod));

    createEditorReadonly(editorView, () => true);
  });

  return <div ref={ref}></div>;
}
