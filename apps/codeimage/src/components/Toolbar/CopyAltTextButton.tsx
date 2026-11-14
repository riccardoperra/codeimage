import {useI18n} from '@codeimage/locale';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {toast} from '@codeimage/ui';
import {Button, Tooltip} from '@codeui/kit';
import {altText} from '@core/altText';
import type {AppLocaleEntries} from '../../i18n';
import {ClipboardIcon} from '../Icons/Clipboard';

export function CopyAltTextButton(props: {
  text?: string;
  onCopy?: () => void;
  size?: 'xs' | 'sm';
  icon?: boolean;
  class?: string;
}) {
  const [t] = useI18n<AppLocaleEntries>();
  const activeEditor = getActiveEditorStore();

  function copy() {
    const editor = activeEditor.editor();
    const text = props.text ?? (editor && altText(editor));
    const onCopy = props.onCopy;
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => {
        onCopy?.();
        toast.success(() => t('altText.copied'));
      },
      () => toast.error(() => t('altText.copyError')),
    );
  }

  return (
    <Tooltip content={t('altText.hint')} theme={'secondary'}>
      <Button
        size={props.size ?? 'sm'}
        theme={'tertiary'}
        variant={'ghost'}
        class={props.class}
        leftIcon={
          props.icon === false ? undefined : <ClipboardIcon size={'sm'} />
        }
        disabled={
          (!props.text && !activeEditor.editor()) ||
          !navigator.clipboard?.writeText
        }
        onClick={copy}
      >
        {t('altText.copy')}
      </Button>
    </Tooltip>
  );
}
