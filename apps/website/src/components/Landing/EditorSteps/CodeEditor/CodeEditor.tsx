import {EditorView} from '@codemirror/view';
import {onMount} from 'solid-js';

interface CodeEditorProps {
  code: string;
}

export function CodeEditor(props: CodeEditorProps) {
  let ref: HTMLDivElement;
  onMount(() => {
    document
      .querySelector('[data-defer-font=codemirror]')
      ?.removeAttribute('media');

    import('solid-codemirror').then(cm => {
      const {ref: setInternalRef, editorView} = cm.createCodeMirror({
        value: props.code,
      });
      cm.createEditorControlledValue(editorView, () => props.code);
      cm.createLazyCompartmentExtension(
        () =>
          Promise.all([
            Promise.resolve(
              EditorView.theme({
                '.cm-content': {
                  fontFamily: 'Jetbrains Mono',
                },
              }),
            ),
            import('@codemirror/lang-javascript').then(m => m.jsxLanguage),
            import('@codeimage/highlight/synthwave84').then(
              m => m.synthwave84Theme.editorTheme,
            ),
          ]),
        editorView,
      );
      setInternalRef(() => ref);
    });
  });

  return <div ref={ref}></div>;
}
