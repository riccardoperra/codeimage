import {useI18n} from '@codeimage/locale';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {toast} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {altText} from '@core/altText';
import type {AppLocaleEntries} from '../../i18n';

export function CopyAltTextButton() {
  const [t] = useI18n<AppLocaleEntries>();
  const activeEditor = getActiveEditorStore();

  function copy() {
    const editor = activeEditor.editor();
    if (!editor) return;
    navigator.clipboard.writeText(altText(editor)).then(
      () => toast.success(() => t('altText.copied')),
      () => toast.error(() => t('altText.copyError')),
    );
  }

  return (
    <Button
      size={'xs'}
      theme={'secondary'}
      disabled={!activeEditor.editor() || !navigator.clipboard?.writeText}
      onClick={copy}
    >
      {t('altText.copy')}
    </Button>
  );
}
