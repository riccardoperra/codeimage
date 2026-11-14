import type {RasterizerName} from '@core/rasterize';
import {effect} from '@codeimage/atomic-state';
import {useI18n} from '@codeimage/locale';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getUiStore} from '@codeimage/store/ui';
import {toast} from '@codeimage/ui';
import {getUmami} from '@core/constants/umami';
import {catchError, EMPTY, exhaustMap, from, pipe, switchMap, tap} from 'rxjs';
import {getOwner, runWithOwner} from 'solid-js';
import {exportImage} from '../../hooks/use-export-image';
import type {ExportOptions} from '../../hooks/use-export-image';
import {ExportExtension, ExportMode} from '../../hooks/use-export-image';
import type {AppLocaleEntries} from '../../i18n';

interface CopyToClipboardEvent {
  ref: HTMLElement;
  renderer: RasterizerName;
}

const owner = getOwner()!;

export const dispatchCopyToClipboard = effect<CopyToClipboardEvent>(
  pipe(
    exhaustMap(({ref, renderer}) => {
      const exportSettings = getExportCanvasStore();
      const options: ExportOptions = {
        mode: ExportMode.getBlob,
        quality: exportSettings.get.jpegQuality / 100,
        pixelRatio: Math.floor(exportSettings.get.devicePixelRatio),
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
            tap(() => runWithOwner(owner, openSnackbar)),
            catchError(() => EMPTY),
            tap(() => getUmami().track('copy-to-clipboard')),
          );
        }),
      );
    }),
  ),
);

function openSnackbar(): void {
  toast.success(
    () => {
      const [t] = useI18n<AppLocaleEntries>();
      return t('canvas.copiedToClipboard');
    },
    {
      position: 'bottom-center',
      theme: getUiStore().invertedThemeMode(),
    },
  );
}
