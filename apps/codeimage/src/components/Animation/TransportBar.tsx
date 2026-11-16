import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {IconButton} from '@codeui/kit';
import {Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {CloseIcon} from '../Icons/CloseIcon';
import {HeaderField} from './HeaderField';
import {LayoutToggle} from './timeline/LayoutToggle';
import {PauseIcon, PlayIcon, StopIcon} from './icons';
import {formatSeconds} from './format';
import * as styles from './AnimatePanel.css';

export const transportInBar = (compact: boolean) => !compact;

export function BarTransport() {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const playing = () => animation.playback().state === 'playing';
  return (
    <>
      <IconButton
        size="sm"
        theme="primary"
        aria-label={playing() ? t('animation.pause') : t('animation.play')}
        title={
          animation.settings().steps.length < 2
            ? t('animation.needsSteps')
            : undefined
        }
        disabled={animation.settings().steps.length < 2}
        onClick={animation.actions.toggle}
        data-bar-play
      >
        {playing() ? <PauseIcon /> : <PlayIcon />}
      </IconButton>
      <output class={styles.barTime} data-animation-time>
        {formatSeconds(animation.playhead(), locale())} /{' '}
        {formatSeconds(animation.durationMs(), locale())}
      </output>
      <LayoutToggle />
    </>
  );
}

export function TransportBar(props: {compact: boolean}) {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const playing = () => animation.playback().state === 'playing';
  const stop = () => animation.actions.editStep(animation.currentStep());
  const close = () => {
    animation.actions.setOpen(false);
    document.querySelector<HTMLElement>('[data-animate-toggle]')?.focus();
  };
  return (
    <div class={styles.transport}>
      <IconButton
        size="sm"
        theme="primary"
        aria-label={playing() ? t('animation.pause') : t('animation.play')}
        title={
          animation.settings().steps.length < 2
            ? t('animation.needsSteps')
            : undefined
        }
        disabled={animation.settings().steps.length < 2}
        onClick={animation.actions.toggle}
      >
        {playing() ? <PauseIcon /> : <PlayIcon />}
      </IconButton>
      <Show when={animation.playback().state !== 'editing'}>
        <IconButton
          size="sm"
          theme="secondary"
          aria-label={t('animation.stop')}
          onClick={stop}
        >
          <StopIcon />
        </IconButton>
      </Show>
      <output class={styles.time} data-animation-time>
        {formatSeconds(animation.playhead(), locale())} /{' '}
        {formatSeconds(animation.durationMs(), locale())}
      </output>
      <span class={styles.spacer} />
      <div class={styles.desktopHeader}>
        <HeaderField />
      </div>
      <Show when={!props.compact}>
        <LayoutToggle />
      </Show>
      <IconButton
        size="sm"
        theme="secondary"
        aria-label={t('animation.close')}
        onClick={close}
      >
        <CloseIcon />
      </IconButton>
    </div>
  );
}
