import {Component, mergeProps, Show} from 'solid-js';
import {Button} from '../ui/Button/Button';
import {useI18n} from '@codeimage/locale';
import {AppLocaleEntries} from '../../i18n';
import {Box} from '../ui/Box/Box';
import {SvgIcon} from '../ui/SvgIcon/SvgIcon';
import {appEnvironment} from '../../core/configuration';
import {useHotkey} from '../../hooks/use-hotkey';

interface ShareButtonProps {
  showLabel?: boolean;
}

export const ShareButton: Component<ShareButtonProps> = props => {
  const computedProps = mergeProps({showLabel: false, props});
  // TODO: hook
  const {support} = appEnvironment;

  const [t] = useI18n<AppLocaleEntries>();

  async function share() {
    const data = {
      // TODO: add tab title
      title: 'Code shared with codeimage.dev',
      url: window.location.search,
      // TODO: should add the exported file? Useful for social media
      files: [],
    };
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
    <Button
      variant={'solid'}
      theme={'secondary'}
      disabled={!support.shareApi}
      onClick={() => share()}
    >
      <SvgIcon viewBox="0 0 20 20" fill="currentColor">
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
      </SvgIcon>
      <Show when={computedProps.showLabel}>
        <Box marginLeft={'2'}>{t('toolbar.share')}</Box>
      </Show>
    </Button>
  );
};
