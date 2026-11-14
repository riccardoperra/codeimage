import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getRootEditorStore} from '@codeimage/store/editor';
import type {EditorView} from '@codemirror/view';
import {createAsyncAction} from '@core/hooks/async-action';
import type {Resource} from 'solid-js';
import type {ExportImagePayload} from './use-export-image';
import {exportTabs} from './export-tabs';
import {ExportMode, exportImage} from './use-export-image';

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
  const canvas = getExportCanvasStore();
  const editor = getRootEditorStore();
  const [data, {notify}] = createAsyncAction(
    async (ref: ExportImagePayload) => {
      if (
        canvas.get.oneImagePerTab &&
        editor.state.editors.length > 1 &&
        (ref.options.mode === ExportMode.export ||
          ref.options.mode === ExportMode.share)
      ) {
        await Promise.all(
          editor.state.editors.map(tab =>
            SUPPORTED_LANGUAGES.find(
              language => language.id === tab.languageId,
            )?.plugin(),
          ),
        );
        return exportTabs({
          payload: ref,
          tabs: editor.state.editors.map(tab => ({
            id: tab.id,
            name: tab.tab.tabName,
          })),
          activeId: editor.state.activeEditorId,
          activate: editor.actions.setActiveEditorId,
          render: async payload => {
            const code = editor.state.editors.find(
              tab => tab.id === editor.state.activeEditorId,
            )?.code;
            const deadline = performance.now() + 5000;
            while (previewEditorView.state.doc.toString() !== code) {
              if (performance.now() > deadline) {
                throw new Error('The export preview did not synchronize.');
              }
              await new Promise<void>(resolve =>
                requestAnimationFrame(() => resolve()),
              );
            }
            return exportSnippet(payload);
          },
        });
      }
      return exportSnippet(ref);
    },
  );

  return [data, notify];
}
