import {useI18n} from '@codeimage/locale';
import {toast} from '@codeimage/ui';
import type {AppLocaleEntries} from '../../i18n';
import type {ExportFontError} from './font-error';

export function notifyFontFallback(error: ExportFontError) {
  toast.error(
    () => {
      const [t] = useI18n<AppLocaleEntries>();
      return t('rendering.fontFallback', {
        font: error.family,
        reason: t(`rendering.fontFailure.${error.reason}`),
      });
    },
    {position: 'bottom-center'},
  );
}
