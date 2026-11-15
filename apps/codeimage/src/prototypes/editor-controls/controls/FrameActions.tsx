import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {dispatchRandomTheme} from '@codeimage/store/effects/onThemeChange';
import {HStack} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {createAsyncAction} from '@core/hooks/async-action';
import {AnimateButton} from '../../../components/Animation/AnimateButton';
import {ColorSwatchIcon} from '../../../components/Icons/ColorSwatch';
import {SparklesIcon} from '../../../components/Icons/SparklesIcon';
import {CopyToClipboardButton} from '../../../components/Toolbar/CopyToClipboardButton';
import {ExportInNewTabButton} from '../../../components/Toolbar/ExportNewTabButton';
import * as styles from '../../../components/Toolbar/FrameToolbar.css';

/**
 * Today's `FrameToolbar`, with the same buttons and markup, without its
 * export settings button: the export settings live in Settings, Export, and
 * the Export control opens them.
 */
export function FrameActions(props: {frameRef: HTMLElement | undefined}) {
  const activeEditor = getActiveEditorStore();
  const [formatAction, {notify: dispatchFormat}] = createAsyncAction(() =>
    activeEditor.format(),
  );

  return (
    <div class={styles.frameToolbar}>
      <HStack spacing={2}>
        <AnimateButton showLabel={true} />
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
