import {
  createEffect,
  createResource,
  createSignal,
  on,
  onMount,
} from 'solid-js';

interface CodeEditorProps {
  code: string;
}

export function CodeEditor(props: CodeEditorProps) {
  let ref: HTMLDivElement;
  const [remoteCm] = createResource(() =>
    Promise.all([import('solid-codemirror'), import('@codemirror/view')]),
  );

  createEffect(
    on(
      remoteCm,
      cmModules => {
        if (!cmModules) return;
        console.log('data');
        const [cm, view] = cmModules;

        const {ref: setInternalRef, editorView} = cm.createCodeMirror({
          value: props.code,
        });

        setInternalRef(() => ref);
        cm.createEditorControlledValue(editorView, () => props.code);
        cm.createCompartmentExtension(
          () =>
            view.EditorView.theme({
              '.cm-content': {
                fontFamily: 'Jetbrains Mono',
              },
            }),
          editorView,
        );
        cm.createLazyCompartmentExtension(
          () =>
            import('@codeimage/highlight/synthwave84').then(
              m => m.synthwave84Theme.editorTheme,
            ),
          editorView,
        );
        cm.createLazyCompartmentExtension(
          () => import('./lang-javascript-plugin').then(m => m.jsxLanguage),
          editorView,
        );
      },
      {defer: true},
    ),
  );

  onMount(() => {
    document
      .querySelector('[data-defer-font=codemirror]')
      ?.removeAttribute('media');

    // Promise.all([
    //   import('@codemirror/state'),
    //   import('@codemirror/view'),
    //   import('solid-codemirror'),
    // ]).then(([, view, cm]) => {
    //   const {ref: setInternalRef, editorView} = cm.createCodeMirror({
    //     value: props.code,
    //   });
    //   setInternalRef(() => ref);
    //   cm.createEditorControlledValue(editorView, () => props.code);
    //   cm.createCompartmentExtension(
    //     () =>
    //       view.EditorView.theme({
    //         '.cm-content': {
    //           fontFamily: 'Jetbrains Mono',
    //         },
    //       }),
    //     editorView,
    //   );
    //   // cm.createLazyCompartmentExtension(
    //   //   () =>
    //   //     Promise.all([
    //   //       import('@codemirror/lang-javascript').then(m => m.javascript()),
    //   //       import('@codeimage/highlight/synthwave84').then(
    //   //         m => m.synthwave84Theme.editorTheme,
    //   //       ),
    //   //     ]),
    //   //   editorView,
    //   // );
  });

  return <div ref={ref}></div>;
}
