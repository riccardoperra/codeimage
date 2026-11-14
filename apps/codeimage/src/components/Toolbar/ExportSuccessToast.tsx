import {useI18n} from '@codeimage/locale';
import {getUiStore} from '@codeimage/store/ui';
import {VStack, toast} from '@codeimage/ui';
import type {AppLocaleEntries} from '../../i18n';
import {CopyAltTextButton} from './CopyAltTextButton';

export function showExportSuccessToast(
  message: 'canvas.copiedToClipboard' | 'altText.exported',
  text: string | undefined,
) {
  toast.success(
    activeToast => {
      const [t] = useI18n<AppLocaleEntries>();
      return (
        <VStack spacing={2}>
          <span>{t(message)}</span>
          <CopyAltTextButton
            text={text}
            onCopy={() => toast.dismiss(activeToast.id)}
          />
        </VStack>
      );
    },
    {
      position: 'bottom-center',
      theme: getUiStore().invertedThemeMode(),
      duration: 8000,
    },
  );
}
