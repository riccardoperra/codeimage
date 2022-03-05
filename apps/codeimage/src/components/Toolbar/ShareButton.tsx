import {Component} from 'solid-js';
import {Button} from '../ui/Button/Button';
import {useI18n} from '@codeimage/locale';
import {AppLocaleEntries} from '../../i18n';

interface ShareButtonProps {}

export const ShareButton: Component<ShareButtonProps> = props => {
  const [t] = useI18n<AppLocaleEntries>();

  async function share() {
    const data = {
      // TODO: add tab title
      title: 'Codeimage.dev shared code',
      text: 'Code',
      // TODO: should add the exported file? Useful for social media
      files: [],
    };
    if (!navigator.canShare(data)) {
      return;
    }
    return await navigator.share(data);
  }

  return (
    <Button
      variant={'solid'}
      theme={'secondary'}
      disabled={!navigator.share}
      onClick={() => share()}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{height: '20px', width: '20px'}}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
      </svg>
    </Button>
  );
};
