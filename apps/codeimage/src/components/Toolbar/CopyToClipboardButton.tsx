import {getExportCanvasStore} from '@codeimage/store/canvas';
import {dispatchCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {Link} from '@codeimage/ui';
import {Button, Tooltip} from '@codeui/kit';
import {Component} from 'solid-js';
import {ExportExtension} from '../../hooks/use-export-image';

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

  function isSupported() {
    return (
      !!navigator &&
      !!navigator.clipboard &&
      !!navigator.clipboard &&
      !!navigator.clipboard.write &&
      [ExportExtension.png, ExportExtension.svg].includes(
        getExportCanvasStore().get.extension,
      )
    );
  }

  return (
    <Tooltip
      content={
        <>
          Your browser may not support the{' '}
          <Link
            underline
            href={
              'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write'
            }
          >
            Clipboard API
          </Link>{' '}
          with the current export extension
        </>
      }
      disabled={isSupported()}
    >
      <Button
        theme={'secondary'}
        disabled={!isSupported()}
        loading={dispatchCopyToClipboard.loading()}
        onClick={copyToClipboard}
        size={'xs'}
      >
        {label()}
      </Button>
    </Tooltip>
  );
};
