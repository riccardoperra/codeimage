import {createEffect, createResource, on, onMount} from 'solid-js';

interface CodeEditorProps {
  code: string;
}

export function CodeEditor(props: CodeEditorProps) {
  let ref: HTMLDivElement;
  const [remoteCm] = createResource(() => import('./editor-core'));

  createEffect(
    on(
      remoteCm,
      cmModules => {
        if (!cmModules) return;
        const {
          EditorView,
          createCompartmentExtension,
          createCodeMirror,
          createEditorControlledValue,
          createEditorReadonly,
          createLazyCompartmentExtension,
          theme,
        } = cmModules;

        const {ref: setInternalRef, editorView} = createCodeMirror({
          value: props.code,
        });

        setInternalRef(() => ref);
        createEditorControlledValue(editorView, () => props.code);
        createEditorReadonly(editorView, () => true);
        createCompartmentExtension(
          () => [
            EditorView.theme({
              '.cm-content': {
                fontFamily: 'Jetbrains Mono',
              },
            }),
            theme,
          ],
          editorView,
        );
        createLazyCompartmentExtension(
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
  });

  return <div ref={ref}></div>;
}
