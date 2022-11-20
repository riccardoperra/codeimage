import {onMount} from 'solid-js';

interface CodeEditorProps {
  code: string;
}

export function CodeEditor(props: CodeEditorProps) {
  let ref: HTMLDivElement;

  onMount(() => {
    Promise.all([
      import('solid-codemirror'),
      import('@codemirror/view'),
      import('@codemirror/state'),
    ]).then(([cm, view]) => {
      const {ref: setInternalRef, editorView} = cm.createCodeMirror({
        value: props.code,
      });
      setInternalRef(() => ref);
      cm.createEditorControlledValue(editorView, () => props.code);

      cm.createLazyCompartmentExtension(
        () =>
          import('@codemirror/lang-javascript').then(({javascript}) =>
            javascript({jsx: true, typescript: true}),
          ),
        editorView,
      );

      cm.createLazyCompartmentExtension(
        () =>
          import('@codeimage/highlight/synthwave84').then(
            m => m.synthwave84Theme.editorTheme,
          ),
        editorView,
      );

      cm.createCompartmentExtension(
        view.EditorView.theme({
          '.cm-content': {
            fontFamily: 'Jetbrains Mono',
          },
        }),
        editorView,
      );
    });
  });

  return <div ref={ref}></div>;
}
