import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../../i18n';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {dispatchCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {Button, Tooltip} from '@codeui/kit';
import type {Component} from 'solid-js';
import {ExportExtension} from '../../../hooks/use-export-image';

interface ExportButtonProps {
  canvasRef: HTMLElement | undefined;
}

export const CopyToClipboardButton: Component<ExportButtonProps> = props => {
  const [t] = useI18n<AppLocaleEntries>();
  const label = () => t('toolbar.copyToCliboard');

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
      content={t('editor.clipboardUnsupported')}
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
