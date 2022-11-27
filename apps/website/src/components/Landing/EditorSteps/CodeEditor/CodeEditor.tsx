import {
  children,
  createEffect,
  createResource,
  on,
  onMount,
  Show,
} from 'solid-js';

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
                fontFamily: 'Jetbrains Mono, monospace',
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
    const el = children(() => (
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap"
      />
    ));
    document.head.appendChild(el() as Node);
  });

  return (
    <>
      <div
        ref={ref}
        style={{
          'font-family': 'Jetbrains Mono, monospace',
        }}
      />
      <Show when={remoteCm.loading}>
        <div
          style={{
            'font-family': 'Jetbrains Mono, monospace',
          }}
        >
          {props.code}
        </div>
      </Show>
    </>
  );
}
