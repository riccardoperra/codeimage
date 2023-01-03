import {dispatchCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {Button} from '@codeimage/ui';
import {Component} from 'solid-js';
import {ClipboardIcon} from '../Icons/Clipboard';

interface ExportButtonProps {
  canvasRef: HTMLElement | undefined;
}

export const CopyToClipboardButton: Component<ExportButtonProps> = props => {
  const label = () => 'Copy to clipboard';

  function copyToClipboard() {
    if (props.canvasRef) {
      return dispatchCopyToClipboard({ref: props.canvasRef});
    }
    return Promise.resolve(true);
  }

  return (
    <Button
      variant={'solid'}
      theme={'secondary'}
      loading={dispatchCopyToClipboard.loading()}
      disabled={dispatchCopyToClipboard.loading()}
      leftIcon={() => <ClipboardIcon />}
      onClick={copyToClipboard}
      size={'xs'}
    >
      {label()}
    </Button>
  );
};
