import {synthwave84Theme} from '@codeimage/highlight/synthwave84';
import {javascript} from '@codemirror/lang-javascript';
import {EditorState, StateEffect} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from 'solid-js';

interface CodeEditorProps {
  code: string;
}

export function CodeEditor(props: {code: string}) {
  const [ref, setRef] = createSignal<HTMLElement>();
  const [editorView, setEditorView] = createSignal<EditorView>();

  createEffect(
    on(ref, ref => {
      const state = EditorState.create({doc: props?.code ?? ''});
      const currentView = new EditorView({
        state,
        parent: ref,
      });

      onMount(() => setEditorView(currentView));

      onCleanup(() => {
        setEditorView(undefined);
        editorView()?.destroy();
      });
    }),
  );

  createEffect(
    on(
      editorView,
      editorView => {
        const localValue = editorView?.state.doc.toString();

        editorView.dispatch({
          effects: StateEffect.reconfigure.of([
            javascript({jsx: true, typescript: true}),
            synthwave84Theme.editorTheme,
            EditorView.theme({
              '.cm-content': {
                fontFamily: 'Jetbrains Mono',
              },
            }),
          ]),
        });

        if (localValue !== props?.code && !!editorView) {
          editorView.dispatch({
            changes: {
              from: 0,
              to: localValue?.length,
              insert: props?.code ?? '',
            },
          });
        }
      },
      {defer: true},
    ),
  );

  const memoizedCode = createMemo(() => props.code);

  createEffect(
    on(editorView, view => {
      if (view) {
        createEffect(
          on(memoizedCode, code => {
            const localValue = view?.state.doc.toString();
            if (localValue !== code) {
              view.dispatch({
                changes: {
                  from: 0,
                  to: localValue?.length,
                  insert: code ?? '',
                },
              });
            }
          }),
        );
      }
    }),
  );

  return <div ref={setRef}></div>;
}
