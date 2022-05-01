import {Component, mergeProps, Show} from 'solid-js';
import {Box, Button, SvgIcon} from '@codeimage/ui';
import {useI18n} from '@codeimage/locale';
import {AppLocaleEntries} from '../../i18n';
import {appEnvironment} from '../../core/configuration';
import {useHotkey} from '../../hooks/use-hotkey';

interface ShareButtonProps {
  showLabel?: boolean;
}

export const ShareButton: Component<ShareButtonProps> = props => {
  const computedProps = mergeProps({showLabel: false, props});
  const {support} = appEnvironment;
  const canShare = support && navigator.canShare(getData());
  const [t] = useI18n<AppLocaleEntries>();

  function getData(): ShareData {
    return {
      title: 'Snippet shared with codeimage.dev',
      url: window.location.search,
    };
  }

  async function share() {
    const data = getData();
    if (!navigator.canShare(data)) {
      return;
    }
    return await navigator.share(data);
  }

  useHotkey(document.body, {
    'Control+Shift+C': async event => {
      event.preventDefault();
      await share();
    },
  });

  return (
    <Show when={canShare}>
      <Button
        aria-label={t('toolbar.share')}
        variant={'solid'}
        theme={'secondary'}
        onClick={() => share()}
      >
        <SvgIcon viewBox="0 0 20 20" fill="currentColor">
          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
        </SvgIcon>
        <Show when={computedProps.showLabel}>
          <Box marginLeft={2}>{t('toolbar.share')}</Box>
        </Show>
      </Button>
    </Show>
  );
};
