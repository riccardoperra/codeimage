import {dispatchCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {Button} from '@codeui/kit';
import {Component} from 'solid-js';

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
      loading={dispatchCopyToClipboard.loading()}
      onClick={copyToClipboard}
      size={'xs'}
    >
      {label()}
    </Button>
  );
};
