import type {RasterizerName} from '@core/rasterize';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {altText} from '@core/altText';
import {getUmami} from '@core/constants/umami';
import {createSignal, flush} from 'solid-js';
import {exportImage} from '../../hooks/use-export-image';
import type {ExportOptions} from '../../hooks/use-export-image';
import {ExportExtension, ExportMode} from '../../hooks/use-export-image';
import {showExportSuccessToast} from '../../components/Toolbar/ExportSuccessToast';

interface CopyToClipboardEvent {
  ref: HTMLElement;
  renderer: RasterizerName;
  /** The export settings' scale without one. */
  pixelRatio?: number;
}

const [copyingToClipboard, setLoading] = createSignal(false);
export {copyingToClipboard};

export async function dispatchCopyToClipboard({
  ref,
  renderer,
  pixelRatio,
}: CopyToClipboardEvent) {
  if (copyingToClipboard()) return;
  flush(() => setLoading(true));
  try {
    const editor = getActiveEditorStore().editor();
    const text = editor && altText(editor);
    const exportSettings = getExportCanvasStore();
    const options: ExportOptions = {
      mode: ExportMode.getBlob,
      quality: exportSettings.get.jpegQuality / 100,
      pixelRatio: Math.floor(pixelRatio ?? exportSettings.get.devicePixelRatio),
      extension: ExportExtension.png,
    };
    const blob = await exportImage({ref, options, renderer});
    if (!(blob instanceof Blob)) return;
    await navigator.clipboard.write([
      new ClipboardItem({[blob.type]: blob}, {presentationStyle: 'attachment'}),
    ]);
    showExportSuccessToast('canvas.copiedToClipboard', text);
    getUmami().track('copy-to-clipboard');
  } catch {
    return;
  } finally {
    setLoading(false);
  }
}
