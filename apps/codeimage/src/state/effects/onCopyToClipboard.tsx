import {effect} from '@codeimage/atomic-state';
import {useI18n} from '@codeimage/locale';
import {getUiStore} from '@codeimage/store/ui';
import {toast} from '@codeimage/ui';
import {getUmami} from '@core/constants/umami';
import {catchError, EMPTY, exhaustMap, from, pipe, switchMap, tap} from 'rxjs';
import {getOwner, runWithOwner} from 'solid-js';
import {
  ExportExtension,
  exportImage,
  ExportMode,
  ExportOptions,
} from '../../hooks/use-export-image';
import {AppLocaleEntries} from '../../i18n';

interface CopyToClipboardEvent {
  ref: HTMLElement;
}

const owner = getOwner()!;

export const dispatchCopyToClipboard = effect<CopyToClipboardEvent>(
  pipe(
    exhaustMap(({ref}) => {
      const options: ExportOptions = {
        mode: ExportMode.getBlob,
        quality: 100,
        pixelRatio: Math.floor(window.devicePixelRatio),
        extension: ExportExtension.png,
      };
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return from(runWithOwner(owner, () => exportImage({ref, options}))!).pipe(
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
            tap(() => getUmami().trackEvent('true', `copy-to-clipboard`)),
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
