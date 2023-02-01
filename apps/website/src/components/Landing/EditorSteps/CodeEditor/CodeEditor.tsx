import {LoadingCircle} from '@codeimage/ui';
import {type Extension} from '@codemirror/state';
import {
  createEffect,
  createResource,
  createSignal,
  on,
  Show,
  Suspense,
} from 'solid-js';
import {CodeEditorPreviewBlock} from '../CodeEditor/CodeEditorPreviewBlock';
import * as styles from './CodeEditor.css';

interface CodeEditorProps {
  code: string;
  customTheme?: Promise<Extension>;
}

export function CodeEditor(props: CodeEditorProps) {
  let ref: HTMLDivElement;
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
                props.customTheme
                  .then(ext => reconfigureTheme(ext))
                  .catch(() => null);
              } else {
                reconfigureTheme(theme);
              }
            },
          ),
        );

        let customThemeExt;
        if (props.customTheme) {
          customThemeExt = createLazyCompartmentExtension(
            () => props.customTheme,
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
            <LoadingCircle size={'sm'} />
          </div>
        </>
      }
    >
      <div
        ref={ref}
        data-load={!!remoteCm()}
        style={{
          'font-family': 'Jetbrains Mono, monospace',
        }}
      />
      <Show when={loading()}>
        <div class={styles.loading}>
          <LoadingCircle size={'sm'} />
        </div>
      </Show>
    </Suspense>
  );
}
