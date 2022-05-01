import {useI18n} from '@codeimage/locale';
import {Box, HStack, useSnackbarStore} from '@codeimage/ui';
import {createAction, createEffect, ofType, props} from '@ngneat/effects';
import {catchError, delay, EMPTY, exhaustMap, from, switchMap, tap} from 'rxjs';
import {CheckCircle} from '../../components/Icons/CheckCircle';
import {
  ExportExtension,
  exportImage,
  ExportMode,
  ExportOptions,
} from '../../hooks/use-export-image';
import {AppLocaleEntries} from '../../i18n';
import {InvertedThemeWrapper} from '../../ui/InvertedThemeWrapper/InvertedThemeWrapper';

interface CopyToClipboardEvent {
  ref: HTMLElement;
}

export const onCopyToClipboard = createAction(
  '[CodeImage] Copy to clipyboard',
  props<CopyToClipboardEvent>(),
);

export const copyToClipboard$ = createEffect(actions =>
  actions.pipe(
    ofType(onCopyToClipboard),
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
            delay(1000),
          );
        }),
      );
    }),
  ),
);

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
