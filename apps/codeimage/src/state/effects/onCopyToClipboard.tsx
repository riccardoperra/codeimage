import type {RasterizerName} from '@core/rasterize';
import {effect} from '@codeimage/atomic-state';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {altText} from '@core/altText';
import {getUmami} from '@core/constants/umami';
import {catchError, EMPTY, exhaustMap, from, pipe, switchMap, tap} from 'rxjs';
import {getOwner, runWithOwner} from 'solid-js';
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

const owner = getOwner()!;

export const dispatchCopyToClipboard = effect<CopyToClipboardEvent>(
  pipe(
    exhaustMap(({ref, renderer, pixelRatio}) => {
      const editor = getActiveEditorStore().editor();
      const text = editor && altText(editor);
      const exportSettings = getExportCanvasStore();
      const options: ExportOptions = {
        mode: ExportMode.getBlob,
        quality: exportSettings.get.jpegQuality / 100,
        pixelRatio: Math.floor(
          pixelRatio ?? exportSettings.get.devicePixelRatio,
        ),
        extension: ExportExtension.png,
      };
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return from(
        runWithOwner(owner, () => exportImage({ref, options, renderer}))!,
      ).pipe(
        switchMap(data => {
          if (!(data instanceof Blob)) return EMPTY;
          return from(
            navigator.clipboard.write([
              new ClipboardItem(
                {
                  [data.type]: data,
                },
                {presentationStyle: 'attachment'},
              ),
            ]),
          ).pipe(
            tap(() =>
              runWithOwner(owner, () =>
                showExportSuccessToast('canvas.copiedToClipboard', text),
              ),
            ),
            catchError(() => EMPTY),
            tap(() => getUmami().track('copy-to-clipboard')),
          );
        }),
      );
    }),
  ),
);
