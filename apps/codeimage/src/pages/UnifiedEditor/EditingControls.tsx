import type {ParentProps} from 'solid-js';
import {children, Show, createTrackedEffect} from 'solid-js';
import type {EditorPageState} from './page-state';
import * as styles from './snippet.css';

/** Loading keeps the owner's geometry; a read-only page gives that space back. */
export function EditingControls(props: ParentProps<{state: EditorPageState}>) {
  const content = children(() => props.children);
  createTrackedEffect(() => {
    const editable = props.state.editable;
    for (const element of content.toArray()) {
      if (!(element instanceof HTMLElement)) continue;
      element.classList.add(styles.controls);
      element.toggleAttribute('data-editing-controls', true);
      element.toggleAttribute('data-editor-disabled', !editable);
      element.inert = !editable;
    }
  });
  return <Show when={props.state.kind !== 'read-only'}>{content()}</Show>;
}
