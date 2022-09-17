import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {JSX, ParentProps, Suspense} from 'solid-js';

export function SuspenseEditorItem(
  props: ParentProps<{fallback: JSX.Element}>,
) {
  const {loadedSnippet} = getEditorSyncAdapter()!;

  const render = () => {
    loadedSnippet();
    return true;
  };

  return (
    <Suspense fallback={props.fallback}>{render() && props.children}</Suspense>
  );
}
