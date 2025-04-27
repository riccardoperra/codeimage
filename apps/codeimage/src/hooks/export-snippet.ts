import {EditorView} from '@codemirror/view';
import {createAsyncAction} from '@core/hooks/async-action';
import {type Resource} from 'solid-js';
import {exportImage, type ExportImagePayload} from './use-export-image';

type ViewState = {printing: boolean};

type InternalEditorView = EditorView & {
  viewState?: ViewState;
  measure?(): void;
};

export let previewEditorView!: EditorView;

export function setPreviewEditorView(editorView: EditorView) {
  previewEditorView = editorView;
}

export function exportSnippet(options: ExportImagePayload) {
  const editorView = previewEditorView as InternalEditorView;
  if (editorView.viewState && editorView.measure) {
    // We need to set the viewState `printing` property to true in order to render the entire code block
    editorView.viewState.printing = true;
    // Then we measure again the editor in order to render every block
    editorView.measure();
  }
  return exportImage(options).finally(() => {
    if (editorView.viewState) {
      // At the end of the render we need to put the printing property to false
      editorView.viewState.printing = false;
    }
    // Then we do a request measure since this event can be scheduled
    editorView.requestMeasure();
  });
}

export function useExportSnippet(): [
  Resource<Blob | string | undefined>,
  (data: ExportImagePayload) => void,
] {
  const [data, {notify}] = createAsyncAction(
    async (ref: ExportImagePayload) => {
      return exportSnippet(ref);
    },
  );

  return [data, notify];
}
