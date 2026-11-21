import {useI18n} from '@codeimage/locale';
import {editorNotifications} from '@ui/notifications';
import type {AppLocaleEntries} from '../../i18n';
import {CopyAltTextButton} from './CopyAltTextButton';
import * as styles from './ExportSuccessToast.css';

export function showExportSuccessToast(
  message: 'canvas.copiedToClipboard' | 'altText.exported',
  text: string | undefined,
) {
  editorNotifications.show({
    tone: 'success',
    duration: 8000,
    description: toast => {
      const [t] = useI18n<AppLocaleEntries>();
      return (
        <div class={styles.content}>
          <span>{t(message)}</span>
          <CopyAltTextButton
            size={'xs'}
            icon={false}
            class={styles.action}
            text={text}
            onCopy={toast.dismiss}
          />
        </div>
      );
    },
  });
}
