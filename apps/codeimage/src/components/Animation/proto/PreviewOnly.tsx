import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {IconButton} from '@codeui/kit';
import {For} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {CloseIcon} from '../../Icons/CloseIcon';
import {formatSeconds} from '../format';
import {HeaderField} from '../HeaderField';
import {PauseIcon, PlayIcon} from '../icons';
import * as panel from '../AnimatePanel.css';
import {Scrubber} from './Scrubber';
import {shortMs} from './StepList';
import * as styles from './proto.css';

/** C: the phone plays and exports; steps and timing are edited on a larger screen. */
export function PreviewOnly() {
  const {animation, editor} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const playing = () => animation.playback().state === 'playing';
  const close = () => {
    animation.actions.setOpen(false);
    document.querySelector<HTMLElement>('[data-animate-toggle]')?.focus();
  };
  const holds = () =>
    animation.segments().filter(segment => segment.kind === 'hold');
  const name = (index: number) =>
    editor.state.editors.find(
      tab => tab.id === animation.settings().steps[index]?.editorId,
    )?.tab.tabName || t('animation.untitledTab');
  return (
    <>
      <div class={panel.transport}>
        <IconButton
          size="sm"
          theme="primary"
          aria-label={playing() ? t('animation.pause') : t('animation.play')}
          disabled={animation.settings().steps.length < 2}
          onClick={animation.actions.toggle}
        >
          {playing() ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        <output class={panel.time} data-animation-time>
          {formatSeconds(animation.playhead(), locale())} /{' '}
          {formatSeconds(animation.durationMs(), locale())}
        </output>
        <HeaderField />
        <IconButton
          size="sm"
          theme="secondary"
          aria-label={t('animation.close')}
          onClick={close}
        >
          <CloseIcon />
        </IconButton>
      </div>
      <Scrubber />
      <div class={styles.chips} data-proto-chips>
        <For each={holds()}>
          {segment => (
            <button
              type="button"
              class={styles.chip}
              data-current={
                animation.playback().state !== 'editing' &&
                animation.currentStep() === segment.index
                  ? ''
                  : undefined
              }
              ref={el =>
                queueMicrotask(() => {
                  if (
                    animation.playback().state === 'playing' &&
                    animation.currentStep() === segment.index
                  )
                    el.scrollIntoView({block: 'nearest', inline: 'nearest'});
                })
              }
              onClick={() => animation.actions.seek(segment.startMs)}
            >
              {segment.index + 1} · {name(segment.index)}
              <span class={styles.muted}>{shortMs(segment.durationMs)}</span>
            </button>
          )}
        </For>
      </div>
      <p class={styles.hint}>
        Edit steps and timing on a larger screen. Here you can play, scrub and
        export.
      </p>
    </>
  );
}
