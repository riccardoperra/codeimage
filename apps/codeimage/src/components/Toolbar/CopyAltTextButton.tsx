import {useI18n} from '@codeimage/locale';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {notifications} from '@ui/notifications';
import {Button, Tooltip} from '@codeui/kit';
import {altText} from '@core/altText';
import type {AppLocaleEntries} from '../../i18n';
import {getWhatsNew} from '../../state/whats-new';
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
        getWhatsNew().seen('alt');
        onCopy?.();
        notifications.show({
          tone: 'success',
          description: () => t('altText.copied'),
          theme: 'page',
          duration: 2000,
        });
      },
      () =>
        notifications.show({
          tone: 'danger',
          description: () => t('altText.copyError'),
          theme: 'page',
        }),
    );
  }

  return (
    <Tooltip content={t('altText.hint')} variant={'secondary'}>
      <Button
        size={props.size ?? 'sm'}
        variant={'tertiary'}
        ghost
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
