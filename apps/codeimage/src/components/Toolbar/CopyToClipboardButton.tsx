import {dispatchCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {Button} from '@codeimage/ui';
import {getUmami} from '@core/constants/umami';
import {Component} from 'solid-js';
import {ClipboardIcon} from '../Icons/Clipboard';

interface ExportButtonProps {
  canvasRef: HTMLElement | undefined;
}

export const CopyToClipboardButton: Component<ExportButtonProps> = props => {
  const label = () => 'Copy to clipboard';

  function copyToClipboard() {
    if (props.canvasRef) {
      getUmami().trackEvent(`true`, 'copy-to-clipboard');
      dispatchCopyToClipboard({ref: props.canvasRef});
    }
  }

  return (
    <Button
      variant={'solid'}
      theme={'secondary'}
      leftIcon={() => <ClipboardIcon />}
      onClick={() => copyToClipboard()}
      size={'xs'}
    >
      {label()}
    </Button>
  );
};
