import {EditorView} from '@codemirror/view';
import {createSignal} from 'solid-js';

const [version, setVersion] = createSignal(0);

export const selectionVersion = version;

export const trackSelection = EditorView.updateListener.of(update => {
  if (update.selectionSet || update.docChanged) setVersion(value => value + 1);
});
