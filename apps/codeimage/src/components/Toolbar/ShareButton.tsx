import {useI18n} from '@codeimage/locale';
import {Button, IconButton, SvgIcon} from '@codeimage/ui';
import {Component, createMemo, mergeProps, onMount, Show} from 'solid-js';
import {useWebshare} from '../../core/hooks/use-webshare';
import {useHotkey} from '../../hooks/use-hotkey';
import {AppLocaleEntries} from '../../i18n';
import {ShareIcon} from '../Icons/ShareIcon';

interface ShareButtonProps {
  showLabel?: boolean;
}

export const ShareButton: Component<ShareButtonProps> = props => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const computedProps = mergeProps({showLabel: false, props});
  const [support, shareable, share] = useWebshare();
  const canShare = createMemo(() => support() && shareable(getData()));
  const [t] = useI18n<AppLocaleEntries>();

  function getData(): ShareData {
    return {
      title: 'Snippet shared with codeimage.dev',
      url: window.location.search,
    };
  }

  async function onShare() {
    const data = getData();
    if (!canShare()) {
      return;
    }
    return share(data);
  }

  async function enterEvent(event: KeyboardEvent) {
    event.preventDefault();
    await onShare();
  }

  onMount(() => {
    useHotkey(document.body, {
      'Control+Shift+C': enterEvent,
    });
  });

  return (
    <Show when={canShare()}>
      <Show
        fallback={() => (
          <IconButton variant={'solid'} theme={'secondary'} onClick={onShare}>
            <ShareIcon size={'sm'} />
          </IconButton>
        )}
        when={props.showLabel}
      >
        <Button
          aria-label={t('toolbar.share')}
          variant={'solid'}
          theme={'secondary'}
          onClick={onShare}
          leftIcon={() => (
            <SvgIcon viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </SvgIcon>
          )}
        >
          {t('toolbar.share')}
        </Button>
      </Show>
    </Show>
  );
};
