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
  NumberField,
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
import {PauseIcon, PlayIcon, StopIcon} from './icons';
import {formatSeconds, Timeline} from './Timeline';

// A NumberField reports every keystroke, so only values in range are kept
// while the user types.
const inRange = (
  value: number | null | undefined,
  {min, max}: {readonly min: number; readonly max: number},
): value is number => typeof value === 'number' && value >= min && value <= max;

export function AnimationPanel() {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const settings = () => animation.settings();
  const playing = () => animation.playback().state === 'playing';
  const previewing = () => animation.playback().state !== 'editing';
  const tabName = (editorId: string) =>
    editor.state.editors.find(({id}) => id === editorId)?.tab.tabName ||
    t('animation.untitledTab');
  const currentStep = () => {
    if (!previewing()) return -1;
    const at = animation.playhead();
    return stepStartsMs(settings()).findLastIndex(start => start <= at);
  };
  const [dragged, setDragged] = createSignal<number | null>(null);
  const [dropTarget, setDropTarget] = createSignal<number | null>(null);

  const timingSummary = () =>
    [
      formatSeconds(settings().transitionMs),
      t(`animation.easing.${settings().easing}`),
      `${settings().fps} fps`,
    ].join(' · ');

  return (
    <section class={styles.island} aria-label={t('animation.panel')}>
      <div class={styles.transport}>
        <IconButton
          size={'sm'}
          theme={'primary'}
          aria-label={playing() ? t('animation.pause') : t('animation.play')}
          onClick={() => animation.actions.toggle()}
        >
          {playing() ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        <Show when={previewing()}>
          <IconButton
            size={'sm'}
            theme={'secondary'}
            aria-label={t('animation.stop')}
            onClick={() => animation.actions.edit()}
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
            <PanelRow
              for={'animationTransitionField-input'}
              label={t('animation.transition')}
            >
              <TwoColumnPanelRow>
                <NumberField
                  id={'animationTransitionField'}
                  size={'xs'}
                  min={DURATION_LIMITS.transitionMs.min}
                  max={DURATION_LIMITS.transitionMs.max}
                  step={50}
                  value={settings().transitionMs}
                  onChange={value => {
                    if (inRange(value, DURATION_LIMITS.transitionMs)) {
                      animation.actions.setTransitionMs(value);
                    }
                  }}
                />
              </TwoColumnPanelRow>
            </PanelRow>
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
                  items={EASINGS.map(easing => ({
                    label: t(`animation.easing.${easing}`),
                    value: easing,
                  }))}
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
                  items={FRAME_RATES.map(fps => ({
                    label: String(fps),
                    value: fps,
                  }))}
                />
              </TwoColumnPanelRow>
            </PanelRow>
          </PopoverContent>
        </Popover>
        <IconButton
          size={'sm'}
          theme={'secondary'}
          aria-label={t('animation.close')}
          onClick={() => animation.actions.setOpen(false)}
        >
          <CloseIcon />
        </IconButton>
      </div>

      <ol class={styles.steps} aria-label={t('animation.steps')}>
        {/* Index keeps a step's popover open while its hold changes. */}
        <Index each={settings().steps}>
          {(step, index) => (
            <li
              class={styles.step}
              draggable={true}
              data-current={currentStep() === index ? '' : undefined}
              data-dragging={dragged() === index ? '' : undefined}
              data-drop-target={
                dropTarget() === index && dragged() !== index ? '' : undefined
              }
              onClick={() =>
                animation.actions.seek(stepStartsMs(settings())[index])
              }
              onDragStart={event => {
                event.dataTransfer?.setData('text/plain', step().editorId);
                setDragged(index);
              }}
              onDragOver={event => {
                event.preventDefault();
                setDropTarget(index);
              }}
              onDragLeave={() => setDropTarget(null)}
              onDragEnd={() => {
                setDragged(null);
                setDropTarget(null);
              }}
              onDrop={event => {
                event.preventDefault();
                const from = dragged();
                if (from !== null && from !== index) {
                  animation.actions.moveStep(from, index);
                }
                setDragged(null);
                setDropTarget(null);
              }}
            >
              <span class={styles.stepIndex}>{index + 1}</span>
              <span class={styles.stepName}>{tabName(step().editorId)}</span>
              <Popover placement={'top'}>
                <PopoverTrigger
                  class={styles.stepHold}
                  aria-label={t('animation.holdFor', {
                    tab: tabName(step().editorId),
                    time: formatSeconds(step().holdMs),
                  })}
                  onClick={(event: MouseEvent) => event.stopPropagation()}
                >
                  {formatSeconds(step().holdMs)}
                </PopoverTrigger>
                {/* A click in the popover bubbles to the step through its portal. */}
                <PopoverContent
                  title={tabName(step().editorId)}
                  class={styles.popover}
                  onClick={(event: MouseEvent) => event.stopPropagation()}
                >
                  <PanelRow
                    for={`animationHold-${index}-input`}
                    label={t('animation.hold')}
                  >
                    <TwoColumnPanelRow>
                      <NumberField
                        id={`animationHold-${index}`}
                        size={'xs'}
                        min={DURATION_LIMITS.holdMs.min}
                        max={DURATION_LIMITS.holdMs.max}
                        step={100}
                        value={step().holdMs}
                        onChange={value => {
                          if (inRange(value, DURATION_LIMITS.holdMs)) {
                            animation.actions.setHoldMs(step().editorId, value);
                          }
                        }}
                      />
                    </TwoColumnPanelRow>
                  </PanelRow>
                  <div class={styles.popoverActions}>
                    <Button
                      size={'xs'}
                      theme={'secondary'}
                      disabled={index === 0}
                      onClick={() =>
                        animation.actions.moveStep(index, index - 1)
                      }
                    >
                      {t('animation.moveEarlier')}
                    </Button>
                    <Button
                      size={'xs'}
                      theme={'secondary'}
                      disabled={index === settings().steps.length - 1}
                      onClick={() =>
                        animation.actions.moveStep(index, index + 1)
                      }
                    >
                      {t('animation.moveLater')}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </li>
          )}
        </Index>
      </ol>
    </section>
  );
}
