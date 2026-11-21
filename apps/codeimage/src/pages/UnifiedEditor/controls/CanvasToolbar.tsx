import {createCanvasBar, type CanvasBarMode} from './canvas-bar';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Button, IconButton, Tooltip} from '@codeui/kit';
import {createAsyncAction} from '@core/hooks/async-action';
import {Show} from 'solid-js';
import {HeaderField} from '../../../components/Animation/HeaderField';
import {
  BarTransport,
  transportInBar,
} from '../../../components/Animation/TransportBar';
import type {AppLocaleEntries} from '../../../i18n';
import {localAi, PromptBar} from '../local-ai/LocalAi';
import {AskAiButton} from '../local-ai/AskAiButton';
import {CopyIcon, SparklesIcon} from '../shell/icons';
import type {Stage} from '../stage';
import * as styles from './canvas-toolbar.css';

export function CanvasToolbar(props: {stage: Stage}) {
  const [t] = useI18n<AppLocaleEntries>();
  const [formatAction, {notify: format}] = createAsyncAction(() =>
    props.stage.format(),
  );
  const exporter = () => props.stage.exporter;
  const {animation} = getEditorStore();
  const wanted = (): CanvasBarMode =>
    animation.open() && transportInBar(props.stage.compact())
      ? 'transport'
      : 'actions';
  const {mode, groups, escape, setBar, setSurface, setAnchor} =
    createCanvasBar(wanted);

  return (
    <div class={styles.anchor}>
      <div
        ref={setBar}
        class={styles.toolbar}
        role="group"
        aria-label={
          mode() === 'transport' ? t('animation.panel') : t('editor.actions')
        }
        data-bar-mode={mode()}
        data-covered={localAi.isOpen() ? '' : undefined}
        onKeyDown={escape}
      >
        <span ref={setSurface} class={styles.surface} data-bar-surface />
        <div
          ref={element => (groups.actions.left = element)}
          class={styles.content}
          data-side="left"
          data-active={mode() === 'actions' ? '' : undefined}
          inert={mode() !== 'actions'}
        >
          <Button
            class={styles.button}
            size={'sm'}
            variant={'secondary'}
            ghost
            loading={formatAction.loading}
            leftIcon={<SparklesIcon size={18} />}
            disabled={!props.stage.canFormat()}
            onClick={() => format()}
          >
            {t('editor.formatCode')}
          </Button>
          <Button
            class={styles.button}
            size={'sm'}
            variant={'secondary'}
            ghost
            leftIcon={<CopyIcon size={18} />}
            disabled={!exporter().canCopy() || exporter().busy()}
            onClick={() => exporter().copy()}
          >
            {t('editor.copyImage')}
          </Button>
        </div>
        <Show when={transportInBar(props.stage.compact())}>
          <div
            ref={element => (groups.transport.left = element)}
            class={styles.content}
            data-side="left"
            data-active={mode() === 'transport' ? '' : undefined}
            inert={mode() !== 'transport'}
            data-bar-transport
          >
            <BarTransport />
            <Tooltip content={t('editor.copyImage')} placement="top">
              <IconButton
                class={styles.button}
                size="sm"
                variant="secondary"
                ghost
                aria-label={t('editor.copyImage')}
                disabled={!exporter().canCopy() || exporter().busy()}
                onClick={() => exporter().copy()}
                data-bar-copy
              >
                <CopyIcon size={18} />
              </IconButton>
            </Tooltip>
          </div>
        </Show>
        <div ref={setAnchor} class={styles.pivot} data-bar-anchor>
          <props.stage.AnimateToggle />
        </div>
        <div
          ref={element => (groups.actions.right = element)}
          class={styles.content}
          data-side="right"
          data-active={mode() === 'actions' ? '' : undefined}
          inert={mode() !== 'actions'}
        >
          <AskAiButton class={styles.button} />
        </div>
        <Show when={transportInBar(props.stage.compact())}>
          <div
            ref={element => (groups.transport.right = element)}
            class={styles.content}
            data-side="right"
            data-active={mode() === 'transport' ? '' : undefined}
            inert={mode() !== 'transport'}
            data-bar-transport
          >
            <HeaderField />
          </div>
        </Show>
      </div>
      <Show when={localAi.isOpen()}>
        <PromptBar />
      </Show>
    </div>
  );
}
