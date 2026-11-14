import {useI18n} from '@codeimage/locale';
import {getUiStore} from '@codeimage/store/ui';
import {toast} from '@codeimage/ui';
import type {AppLocaleEntries} from '../../i18n';
import {CopyAltTextButton} from './CopyAltTextButton';
import * as styles from './ExportSuccessToast.css';

export function showExportSuccessToast(
  message: 'canvas.copiedToClipboard' | 'altText.exported',
  text: string | undefined,
) {
  const theme = getUiStore().invertedThemeMode();
  toast.success(
    activeToast => {
      const [t] = useI18n<AppLocaleEntries>();
      return (
        <div class={styles.content} data-cui-theme={theme}>
          <span>{t(message)}</span>
          <CopyAltTextButton
            size={'xs'}
            icon={false}
            class={styles.action}
            text={text}
            onCopy={() => toast.dismiss(activeToast.id)}
          />
        </div>
      );
    },
    {
      position: 'bottom-center',
      theme,
      duration: 8000,
      style: {'max-width': 'min(480px, calc(100vw - 32px))'},
    },
  );
}
