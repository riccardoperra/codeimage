import {useI18n} from '@codeimage/locale';
import {Box, HStack, useSnackbarStore} from '@codeimage/ui';
import {InvertedThemeWrapper} from '@ui/InvertedThemeWrapper/InvertedThemeWrapper';
import {
  catchError,
  delay,
  EMPTY,
  exhaustMap,
  from,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import {CheckCircle} from '../../components/Icons/CheckCircle';
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

const event$ = new Subject<CopyToClipboardEvent>();

export function dispatchCopyToClipboard(event: CopyToClipboardEvent) {
  event$.next(event);
}

event$
  .pipe(
    exhaustMap(({ref}) => {
      const options: ExportOptions = {
        mode: ExportMode.getBlob,
        quality: 100,
        pixelRatio: Math.floor(window.devicePixelRatio),
        extension: ExportExtension.png,
      };
      return from(exportImage({ref, options})).pipe(
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
            catchError(() => EMPTY),
            tap(openSnackbar),
            tap(() => umami.trackEvent('true', `copy-to-clipboard`)),
            delay(1000),
          );
        }),
      );
    }),
  )
  .subscribe();

function openSnackbar(): void {
  const snackbarStore = useSnackbarStore();
  const snackbar = snackbarStore.create({
    closeable: true,
    wrapper: InvertedThemeWrapper,
    message: () => {
      const [t] = useI18n<AppLocaleEntries>();
      return (
        <HStack alignItems={'center'} spacing={'2'}>
          <Box color={'primary'} display={'flex'} alignItems={'center'}>
            <CheckCircle />
          </Box>
          {t('canvas.copiedToClipboard')}
        </HStack>
      );
    },
  });
  setTimeout(() => snackbarStore.remove(snackbar), 2500);
}
