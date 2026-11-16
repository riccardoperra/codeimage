import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Button, IconButton} from '@codeui/kit';
import {Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {CloseIcon} from '../Icons/CloseIcon';
import {HeaderField} from './HeaderField';
import {StepsMenu} from './StepsMenu';
import {PauseIcon, PlayIcon, StopIcon} from './icons';
import {formatSeconds} from './format';
import * as styles from './AnimatePanel.css';
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
    <div class={styles.transport} data-animation-transport>
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
      <Show when={!props.compact}>
        <HeaderField />
        <Button
          size="xs"
          theme={animation.settings().typewriter ? 'primary' : 'secondary'}
          aria-pressed={animation.settings().typewriter === true}
          data-animation-typewriter
          onClick={() =>
            animation.actions.setTypewriter(!animation.settings().typewriter)
          }
        >
          {t('animation.typewriter')}
        </Button>
        <StepsMenu />
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
