import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {DURATION_LIMITS} from '@codeimage/store/editor/animationSettings';
import {createSignal, Show, onCleanup} from 'solid-js';
import {EasingField} from '../EasingField';
import {DurationInput} from '../DurationInput';
import type {TimelineModel} from './model';
import * as styles from './toolbar.css';

type Open = {stepId: string; anchor: HTMLElement};
const [opened, setOpened] = createSignal<Open | null>(null);
let closed: {stepId: string; at: number} | null = null;

export function openTransition(event: MouseEvent, stepId: string) {
  const anchor = event.currentTarget;
  if (!(anchor instanceof HTMLElement)) return;
  if (
    closed &&
    closed.stepId === stepId &&
    performance.now() - closed.at < 400
  ) {
    closed = null;
    return;
  }
  setOpened({stepId, anchor});
}

export function TransitionPopover(props: {
  model: TimelineModel;
  compact: boolean;
}) {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  onCleanup(() => setOpened(null));
  return (
    <Show when={opened()} keyed>
      {value => {
        const transition = () => props.model.stepOf(value.stepId)?.transition;
        const close = (open: boolean) => {
          if (open) return;
          closed = {stepId: value.stepId, at: performance.now()};
          setOpened(null);
        };
        return (
          <Show when={transition()}>
            {current => (
              <EasingField
                stepId={value.stepId}
                modal={props.compact}
                anchor={value.anchor}
                open
                onOpenChange={close}
                class={styles.chipPopover}
                header={
                  <DurationInput
                    id="animationChipDuration"
                    field="transition"
                    label={t('animation.transition')}
                    value={current().durationMs}
                    limits={DURATION_LIMITS.transitionMs}
                    commit={ms =>
                      animation.actions.setTransition(value.stepId, {ms})
                    }
                  />
                }
              />
            )}
          </Show>
        );
      }}
    </Show>
  );
}
