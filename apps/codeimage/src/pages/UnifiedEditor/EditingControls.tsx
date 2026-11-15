import type {ParentProps} from 'solid-js';
import {children, createEffect} from 'solid-js';
import type {EditorPageState} from './page-state';
import * as styles from './snippet.css';

/** Keep the controls' footprint so ownership never changes the frame's box. */
export function EditingControls(props: ParentProps<{state: EditorPageState}>) {
  const content = children(() => props.children);
  createEffect(() => {
    const editable = props.state.editable;
    for (const element of content.toArray()) {
      if (!(element instanceof HTMLElement)) continue;
      element.classList.add(styles.controls);
      element.toggleAttribute('data-editing-controls', true);
      element.toggleAttribute('data-editor-disabled', !editable);
      element.inert = !editable;
    }
  });
  return <>{content()}</>;
}
