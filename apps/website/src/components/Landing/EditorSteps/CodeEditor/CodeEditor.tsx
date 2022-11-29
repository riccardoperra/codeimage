import {type Extension} from '@codemirror/state';
import {createEffect, createResource, on, Suspense} from 'solid-js';

interface CodeEditorProps {
  code: string;
  customTheme?: Promise<Extension>;
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
          fixCodeMirrorAriaRole,
        } = cmModules;

        const {ref: setInternalRef, editorView} = createCodeMirror({
          value: props.code,
        });

        setInternalRef(() => ref);
        fixCodeMirrorAriaRole(() => ref);
        createEditorControlledValue(editorView, () => props.code);
        createEditorReadonly(editorView, () => true);
        createCompartmentExtension(
          () => [
            EditorView.theme({
              '.cm-content': {
                fontFamily: 'Jetbrains Mono, monospace',
              },
            }),
            !props.customTheme ? theme : [],
          ],
          editorView,
        );

        if (props.customTheme) {
          createLazyCompartmentExtension(() => props.customTheme, editorView);
        }

        createLazyCompartmentExtension(
          () => import('./lang-javascript-plugin').then(m => m.jsxLanguage),
          editorView,
        );
      },
      {defer: true},
    ),
  );

  return (
    <Suspense
      fallback={
        <pre
          style={{
            'font-family': 'Jetbrains Mono, monospace',
            'background-color': 'unset',
            color: 'white',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            margin: 0,
          }}
          innerText={props.code}
        />
      }
    >
      <div
        ref={ref}
        data-load={!!remoteCm()}
        style={{
          'font-family': 'Jetbrains Mono, monospace',
        }}
      />
    </Suspense>
  );
}
