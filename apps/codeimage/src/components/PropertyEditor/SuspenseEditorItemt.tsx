import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorInit';
import {JSX, ParentProps, Suspense} from 'solid-js';

export function SuspenseEditorItem(
  props: ParentProps<{fallback: JSX.Element}>,
) {
  const {loadedSnippet} = getEditorSyncAdapter()!;

  return (
    <Suspense fallback={props.fallback}>
      {loadedSnippet.error && loadedSnippet() && false}
      {props.children}
    </Suspense>
  );
}
