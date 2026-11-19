import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import type {JSX} from '@solidjs/web';
import type {ParentProps} from 'solid-js';
import {Loading} from 'solid-js';

export function SuspenseEditorItem(
  props: ParentProps<{fallback: JSX.Element}>,
) {
  const {loadedSnippet} = getEditorSyncAdapter()!;

  const render = () => {
    loadedSnippet();
    return true;
  };

  return (
    <Loading fallback={props.fallback}>{render() && props.children}</Loading>
  );
}
