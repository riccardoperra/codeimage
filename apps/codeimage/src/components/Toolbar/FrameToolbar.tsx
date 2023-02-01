import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {dispatchRandomTheme} from '@codeimage/store/effects/onThemeChange';
import {Button, HStack} from '@codeimage/ui';
import {createAsyncAction} from '@core/hooks/async-action';
import {ColorSwatchIcon} from '../Icons/ColorSwatch';
import {SparklesIcon} from '../Icons/SparklesIcon';
import {CopyToClipboardButton} from './CopyToClipboardButton';
import {ExportInNewTabButton} from './ExportNewTabButton';
import * as styles from './FrameToolbar.css';

interface FrameToolbarProps {
  frameRef: HTMLElement | undefined;
}

export function FrameToolbar(props: FrameToolbarProps) {
  const activeEditor = getActiveEditorStore();
  const [formatAction, {notify: dispatchFormat}] = createAsyncAction(() =>
    activeEditor.format(),
  );

  return (
    <div class={styles.frameToolbar}>
      <HStack spacing={2}>
        <CopyToClipboardButton canvasRef={props.frameRef} />
        <Button
          size={'xs'}
          variant={'solid'}
          theme={'secondary'}
          leftIcon={<ColorSwatchIcon />}
          onClick={() => dispatchRandomTheme()}
        >
          Randomize
        </Button>
        <Button
          size={'xs'}
          variant={'solid'}
          theme={'secondary'}
          loading={formatAction.loading}
          leftIcon={<SparklesIcon />}
          disabled={!activeEditor.canFormat() || formatAction.loading}
          onClick={() => dispatchFormat()}
        >
          Format
        </Button>
        <ExportInNewTabButton canvasRef={props.frameRef} size={'xs'} />
      </HStack>
    </div>
  );
}
