import {useI18n} from '@codeimage/locale';
import {Button} from '@codeui/kit';
import {createAsyncAction} from '@core/hooks/async-action';
import {Show} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {AskAiButton, localAi, PromptBar} from '../local-ai/LocalAi';
import {CopyIcon, SparklesIcon} from '../shell/icons';
import type {Stage} from '../stage';
import * as styles from './canvas-toolbar.css';

/**
 * The actions on the image under the canvas: format the code, copy the image
 * with the export settings and, with the Local AI experiment, ask for a
 * change, which turns the toolbar into the prompt bar.
 */
export function CanvasToolbar(props: {stage: Stage}) {
  const [t] = useI18n<AppLocaleEntries>();
  const [formatAction, {notify: format}] = createAsyncAction(() =>
    props.stage.format(),
  );
  const exporter = () => props.stage.exporter;

  return (
    <Show when={!localAi.isOpen()} fallback={<PromptBar />}>
      <div class={styles.toolbar} role="group" aria-label={t('editor.actions')}>
        <Button
          size={'sm'}
          theme={'secondary'}
          variant={'ghost'}
          loading={formatAction.loading}
          leftIcon={<SparklesIcon size={18} />}
          disabled={!props.stage.canFormat()}
          onClick={() => format()}
        >
          {t('editor.formatCode')}
        </Button>
        <Button
          size={'sm'}
          theme={'secondary'}
          variant={'ghost'}
          leftIcon={<CopyIcon size={18} />}
          disabled={!exporter().canCopy() || exporter().busy()}
          onClick={() => exporter().copy()}
        >
          {t('editor.copyImage')}
        </Button>
        <AskAiButton />
      </div>
    </Show>
  );
}
