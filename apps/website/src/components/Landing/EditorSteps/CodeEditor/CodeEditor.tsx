import {type Extension} from '@codemirror/state';
import type {LazyCompartmentReconfigurationCallback} from 'solid-codemirror/dist/types/core/createLazyCompartmentExtension';
import {
  createEffect,
  createResource,
  createSignal,
  on,
  Show,
  Suspense,
} from 'solid-js';
import {CodeEditorPreviewBlock} from '../CodeEditor/CodeEditorPreviewBlock';
import styles from './CodeEditor.module.css';

interface CodeEditorProps {
  code: string;
  customTheme?: Promise<Extension>;
}

export function CodeEditor(props: CodeEditorProps) {
  let ref: HTMLDivElement | undefined;
  const [remoteCm] = createResource(() => import('./editor-core'));
  const [loading, setLoading] = createSignal(true);

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

        setInternalRef(() => ref!);
        createEditorControlledValue(editorView, () => props.code);
        createEditorReadonly(editorView, () => true);
        createCompartmentExtension(
          () => [
            EditorView.contentAttributes.of({
              'aria-label': 'codeimage-editor',
            }),
            EditorView.theme({
              '.cm-content': {
                fontFamily: 'Jetbrains Mono, monospace',
              },
            }),
          ],
          editorView,
        );

        const initialTheme = !props.customTheme ? theme : undefined;
        const reconfigureTheme = createCompartmentExtension(
          () => initialTheme,
          editorView,
        );
        createEffect(
          on(
            () => props.customTheme,
            customTheme => {
              if (customTheme) {
                customTheme
                  .then(ext => reconfigureTheme(ext))
                  .catch(() => null);
              } else {
                reconfigureTheme(theme);
              }
            },
          ),
        );

        let customThemeExt: LazyCompartmentReconfigurationCallback;
        if (props.customTheme) {
          customThemeExt = createLazyCompartmentExtension(
            () => props.customTheme!,
            editorView,
          );
        }

        const jsExt = createLazyCompartmentExtension(
          () => import('./lang-javascript-plugin').then(m => m.jsxLanguage),
          editorView,
        );
        createEffect(() => {
          const customThemeLoading = customThemeExt
            ? customThemeExt.loading
            : false;
          const jsLoading = jsExt.loading;
          setLoading(!(!jsLoading && !customThemeLoading));
        });
      },
      {defer: true},
    ),
  );

  return (
    <Suspense
      fallback={
        <>
          <CodeEditorPreviewBlock code={props.code} />
          <div class={styles.loading}>
            <span class={styles.spinner} aria-hidden="true" />
          </div>
        </>
      }
    >
      <div
        ref={el => (ref = el)}
        data-load={!!remoteCm()}
        style={{
          'font-family': 'Jetbrains Mono, monospace',
        }}
      />
      <Show when={loading()}>
        <div class={styles.loading}>
          <span class={styles.spinner} aria-hidden="true" />
        </div>
      </Show>
    </Suspense>
  );
}
