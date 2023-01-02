import {dispatchCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {Button} from '@codeimage/ui';
import {getUmami} from '@core/constants/umami';
import {createAsyncAction} from '@core/hooks/async-action';
import {Component} from 'solid-js';
import {ClipboardIcon} from '../Icons/Clipboard';

interface ExportButtonProps {
  canvasRef: HTMLElement | undefined;
}

export const CopyToClipboardButton: Component<ExportButtonProps> = props => {
  const label = () => 'Copy to clipboard';

  const [action, {notify: dispatch}] = createAsyncAction(() =>
    copyToClipboard(),
  );

  function copyToClipboard() {
    if (props.canvasRef) {
      getUmami().trackEvent(`true`, 'copy-to-clipboard');
      return dispatchCopyToClipboard({ref: props.canvasRef});
    }
    return Promise.resolve(true);
  }

  return (
    <Button
      variant={'solid'}
      theme={'secondary'}
      loading={action.loading}
      disabled={action.loading}
      leftIcon={() => <ClipboardIcon />}
      onClick={dispatch}
      size={'xs'}
    >
      {label()}
    </Button>
  );
};
