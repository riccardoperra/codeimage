import {useI18n} from '@codeimage/locale';
import {editorNotifications} from '@ui/notifications';
import type {AppLocaleEntries} from '../../i18n';
import type {ExportFontError} from './font-error';

export function notifyFontFallback(error: ExportFontError) {
  editorNotifications.show({
    tone: 'danger',
    description: () => {
      const [t] = useI18n<AppLocaleEntries>();
      return t('rendering.fontFallback', {
        font: error.family,
        reason: t(`rendering.fontFailure.${error.reason}`),
      });
    },
    theme: 'page',
  });
}
