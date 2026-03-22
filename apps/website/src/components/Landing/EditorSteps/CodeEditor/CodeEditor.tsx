import {type Extension} from '@codemirror/state';
import {createEffect, createSignal, on, onMount, Show} from 'solid-js';
import {CodeEditorPreviewBlock} from '../CodeEditor/CodeEditorPreviewBlock';
import styles from './CodeEditor.module.css';

// oxlint-disable-next-line typescript/consistent-type-imports
type EditorCoreModule = Awaited<typeof import('./editor-core')>;

interface CodeEditorProps {
  code: string;
  customTheme?: Promise<Extension>;
}

export function CodeEditor(props: CodeEditorProps) {
  let ref: HTMLDivElement | undefined;
  const [remoteCm, setRemoteCm] = createSignal<EditorCoreModule>();
  const [loading, setLoading] = createSignal(true);

  onMount(() => {
    void import('./editor-core')
      .then(setRemoteCm)
      .catch(() => setLoading(false));
  });

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

        const customThemeExt = props.customTheme
          ? createLazyCompartmentExtension(() => props.customTheme!, editorView)
          : null;

        const jsExt = createLazyCompartmentExtension(
          () => import('./lang-javascript-plugin').then(m => m.jsxLanguage),
          editorView,
        );
        createEffect(() => {
          const customThemeLoading = customThemeExt?.loading ?? false;
          const jsLoading = jsExt.loading;
          setLoading(!(!jsLoading && !customThemeLoading));
        });
      },
      {defer: true},
    ),
  );

  return (
    <Show
      when={remoteCm()}
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
    </Show>
  );
}
