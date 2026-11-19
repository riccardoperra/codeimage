import {useI18n} from '@codeimage/locale';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {HStack} from '@codeimage/ui';
import {Button} from '@ui/legacy-controls';
import type {AppLocaleEntries} from '../../i18n';
import {SparklesIcon} from '../Icons/SparklesIcon';

export function FormatPasteToast(props: {onFormat: () => void}) {
  const [t] = useI18n<AppLocaleEntries>();
  const activeEditor = getActiveEditorStore();
  return (
    <HStack spacing={5} justifyContent="spaceBetween" alignItems="center">
      <span>{t('canvas.pastedCode')}</span>
      <Button
        size="xs"
        theme="primary"
        leftIcon={<SparklesIcon size="xs" />}
        disabled={!activeEditor.canFormat()}
        onClick={() => props.onFormat()}
      >
        {t('editor.formatCode')}
      </Button>
    </HStack>
  );
}
