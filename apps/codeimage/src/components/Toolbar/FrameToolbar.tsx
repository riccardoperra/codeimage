import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {dispatchRandomTheme} from '@codeimage/store/effects/onThemeChange';
import {HStack} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {createAsyncAction} from '@core/hooks/async-action';
import {ColorSwatchIcon} from '../Icons/ColorSwatch';
import {SparklesIcon} from '../Icons/SparklesIcon';
import {CopyToClipboardButton} from './CopyToClipboardButton';
import {ExportInNewTabButton} from './ExportNewTabButton';
import {ExportSettingsButton} from './ExportSettingsButton';
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
        <ExportSettingsButton />
        <CopyToClipboardButton canvasRef={props.frameRef} />
        <Button
          size={'xs'}
          theme={'secondary'}
          leftIcon={<ColorSwatchIcon />}
          onClick={() => dispatchRandomTheme()}
        >
          Randomize
        </Button>
        <Button
          size={'xs'}
          theme={'secondary'}
          loading={formatAction.loading}
          leftIcon={<SparklesIcon />}
          disabled={!activeEditor.canFormat()}
          onClick={() => dispatchFormat()}
        >
          Format
        </Button>
        <ExportInNewTabButton canvasRef={props.frameRef} size={'xs'} />
      </HStack>
    </div>
  );
}
