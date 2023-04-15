import {dispatchCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {LoadingCircle} from '@codeimage/ui';
import {Button} from '@codeui/kit';
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
      theme={'secondary'}
      disabled={dispatchCopyToClipboard.loading()}
      leftIcon={
        dispatchCopyToClipboard.loading() ? (
          <LoadingCircle size={'xs'} />
        ) : (
          <ClipboardIcon />
        )
      }
      onClick={copyToClipboard}
      size={'xs'}
    >
      {label()}
    </Button>
  );
};
