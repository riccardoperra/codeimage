import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {
  DURATION_LIMITS,
  EASINGS,
  FRAME_RATES,
  stepStartsMs,
} from '@codeimage/store/editor/animation';
import {
  Button,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@codeui/kit';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {createSignal, Index, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {CloseIcon} from '../Icons/CloseIcon';
import {PanelRow, TwoColumnPanelRow} from '../PropertyEditor/PanelRow';
import * as styles from './AnimationPanel.css';
import {AnimationStep, type StepDrag} from './AnimationStep';
import {DurationField} from './DurationField';
import {PauseIcon, PlayIcon, StopIcon} from './icons';
import {formatSeconds, Timeline} from './Timeline';

export function AnimationPanel() {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const settings = () => animation.settings();
  const playing = () => animation.playback().state === 'playing';
  const previewing = () => animation.playback().state !== 'editing';
  const currentStep = () =>
    previewing()
      ? stepStartsMs(settings()).findLastIndex(
          start => start <= animation.playhead(),
        )
      : -1;
  const [drag, setDrag] = createSignal<StepDrag | null>(null);

  const timingSummary = () =>
    [
      formatSeconds(settings().transitionMs),
      t(`animation.easing.${settings().easing}`),
      `${settings().fps} fps`,
    ].join(' · ');
  const easingItems = () =>
    EASINGS.map(easing => ({
      label: t(`animation.easing.${easing}`),
      value: easing,
    }));
  const frameRateItems = FRAME_RATES.map(fps => ({
    label: String(fps),
    value: fps,
  }));

  const onStop = () => {
    animation.actions.edit();
    editor.activeEditorView()?.focus();
  };
  const onClose = () => animation.actions.setOpen(false);

  return (
    <section class={styles.island} aria-label={t('animation.panel')}>
      <div class={styles.transport}>
        <IconButton
          size={'sm'}
          theme={'primary'}
          aria-label={playing() ? t('animation.pause') : t('animation.play')}
          onClick={animation.actions.toggle}
        >
          {playing() ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        <Show when={previewing()}>
          <IconButton
            size={'sm'}
            theme={'secondary'}
            aria-label={t('animation.stop')}
            onClick={onStop}
          >
            <StopIcon />
          </IconButton>
        </Show>
        <Timeline />
        <span class={styles.time}>
          {formatSeconds(animation.playhead())} /{' '}
          {formatSeconds(animation.durationMs())}
        </span>
        <Popover placement={'top-end'}>
          <PopoverTrigger
            as={Button}
            size={'sm'}
            theme={'secondary'}
            class={styles.timing}
          >
            {timingSummary()}
          </PopoverTrigger>
          <PopoverContent title={t('animation.timing')} class={styles.popover}>
            <DurationField
              id={'animationTransitionField'}
              label={t('animation.transition')}
              limits={DURATION_LIMITS.transitionMs}
              step={50}
              value={settings().transitionMs}
              onChange={animation.actions.setTransitionMs}
            />
            <PanelRow
              for={'animationEasingField'}
              label={t('animation.easing.label')}
            >
              <TwoColumnPanelRow>
                <SegmentedField
                  id={'animationEasingField'}
                  size={'xs'}
                  adapt
                  value={settings().easing}
                  onChange={animation.actions.setEasing}
                  items={easingItems()}
                />
              </TwoColumnPanelRow>
            </PanelRow>
            <PanelRow for={'animationFpsField'} label={t('animation.fps')}>
              <TwoColumnPanelRow>
                <SegmentedField
                  id={'animationFpsField'}
                  size={'xs'}
                  adapt
                  value={settings().fps}
                  onChange={animation.actions.setFps}
                  items={frameRateItems}
                />
              </TwoColumnPanelRow>
            </PanelRow>
          </PopoverContent>
        </Popover>
        <IconButton
          size={'sm'}
          theme={'secondary'}
          aria-label={t('animation.close')}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </div>

      <ol class={styles.steps} aria-label={t('animation.steps')}>
        {/* Index keeps a step's popover open while its hold changes. */}
        <Index each={settings().steps}>
          {(step, index) => (
            <AnimationStep
              step={step()}
              index={index}
              current={currentStep() === index}
              drag={drag()}
              onDragChange={setDrag}
            />
          )}
        </Index>
      </ol>
    </section>
  );
}
