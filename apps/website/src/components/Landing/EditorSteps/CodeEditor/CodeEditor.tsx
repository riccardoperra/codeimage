import {EditorView} from '@codemirror/view';
import {
  createCodeMirror,
  createEditorControlledValue,
  createLazyCompartmentExtension,
} from 'solid-codemirror';
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

    const {ref: setInternalRef, editorView} = createCodeMirror({
      value: props.code,
    });
    setInternalRef(() => ref);

    createEditorControlledValue(editorView, () => props.code);

    createLazyCompartmentExtension(
      () =>
        Promise.all([
          Promise.resolve(
            EditorView.theme({
              '.cm-content': {
                fontFamily: 'Jetbrains Mono',
              },
            }),
          ),
          import('@codemirror/lang-javascript').then(({javascript}) =>
            javascript({jsx: true, typescript: true}),
          ),
          import('@codeimage/highlight/synthwave84').then(
            m => m.synthwave84Theme.editorTheme,
          ),
        ]),
      editorView,
    );
  });

  return <div ref={ref}></div>;
}
