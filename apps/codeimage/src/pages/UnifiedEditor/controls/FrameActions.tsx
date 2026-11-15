import {useI18n} from '@codeimage/locale';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {dispatchRandomTheme} from '@codeimage/store/effects/onThemeChange';
import {HStack} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {createAsyncAction} from '@core/hooks/async-action';
import {ColorSwatchIcon} from '../../../components/Icons/ColorSwatch';
import {SparklesIcon} from '../../../components/Icons/SparklesIcon';
import * as styles from '../../../components/Toolbar/FrameToolbar.css';
import type {AppLocaleEntries} from '../../../i18n';

/**
 * Today's `FrameToolbar`, with the same buttons and markup, with its image actions in the Export menu.
 */
export function FrameActions() {
  const [t] = useI18n<AppLocaleEntries>();
  const activeEditor = getActiveEditorStore();
  const [formatAction, {notify: dispatchFormat}] = createAsyncAction(() =>
    activeEditor.format(),
  );

  const randomize = () => dispatchRandomTheme();
  const format = () => dispatchFormat();

  return (
    <div class={styles.frameToolbar}>
      <HStack spacing={2}>
        <Button
          size={'xs'}
          theme={'secondary'}
          leftIcon={<ColorSwatchIcon />}
          onClick={randomize}
        >
          {t('editor.randomizeShort')}
        </Button>
        <Button
          size={'xs'}
          theme={'secondary'}
          loading={formatAction.loading}
          leftIcon={<SparklesIcon />}
          disabled={!activeEditor.canFormat()}
          onClick={format}
        >
          {t('editor.formatShort')}
        </Button>
      </HStack>
    </div>
  );
}
