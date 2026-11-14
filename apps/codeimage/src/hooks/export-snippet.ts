import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {altText} from '@core/altText';
import {createAsyncAction} from '@core/hooks/async-action';
import {loadLanguage} from '@core/snapshot/tokenize';
import {createComponent, getOwner, runWithOwner, type Resource} from 'solid-js';
import {render} from 'solid-js/web';
import {PreviewFrame} from '../components/Frame/PreviewFrame';
import {showExportSuccessToast} from '../components/Toolbar/ExportSuccessToast';
import type {ExportImagePayload} from './use-export-image';
import {deliverTabFiles, renderTabFiles} from './export-tabs';
import {ExportMode, exportImage} from './use-export-image';

export function useExportSnippet(): [
  Resource<Blob | string | undefined>,
  (data: ExportImagePayload) => void,
] {
  const canvas = getExportCanvasStore();
  const editor = getRootEditorStore();
  const owner = getOwner();

  async function exportEachTab(payload: ExportImagePayload) {
    const tabs = editor.state.editors.map(tab => ({
      ...tab,
      tab: {...tab.tab},
      name: tab.tab.tabName,
    }));
    const files = await renderTabFiles(tabs, async tab => {
      const language = await loadLanguage(tab.languageId, tab.tab.tabName);
      let ref: HTMLDivElement | undefined;
      const dispose = render(
        () =>
          createComponent(PreviewFrame, {
            tab,
            language,
            ref: el => (ref = el),
          }),
        document.createElement('div'),
        undefined,
        {owner},
      );
      try {
        return await exportImage({
          ...payload,
          ref,
          options: {...payload.options, mode: ExportMode.getBlob},
        });
      } finally {
        dispose();
      }
    });
    return deliverTabFiles(files, payload.options.mode);
  }

  const [data, {notify}] = createAsyncAction(
    async (ref: ExportImagePayload) => {
      const activeEditor = getActiveEditorStore().editor();
      const text = activeEditor && altText(activeEditor);
      const eachTab =
        canvas.get.oneImagePerTab &&
        editor.state.editors.length > 1 &&
        (ref.options.mode === ExportMode.export ||
          ref.options.mode === ExportMode.share);
      const result = await (eachTab ? exportEachTab(ref) : exportImage(ref));
      if (
        result &&
        (ref.options.mode === ExportMode.export ||
          ref.options.mode === ExportMode.share)
      ) {
        runWithOwner(owner, () =>
          showExportSuccessToast('altText.exported', text),
        );
      }
      return result;
    },
  );

  return [data, notify];
}
