import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {
  DURATION_LIMITS,
  transitionOf,
} from '@codeimage/store/editor/animationSettings';
import {Button, NumberField} from '@codeui/kit';
import {createEffect, createSignal, Show, untrack} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {EasingField} from './EasingField';
import * as styles from './AnimatePanel.css';
function DurationInput(props: {
  id: string;
  label: string;
  value: number;
  limits: {min: number; max: number};
  commit: (value: number) => void;
}) {
  const [pending, setPending] = createSignal<number | null | undefined>(
    untrack(() => props.value),
  );
  createEffect(() => setPending(props.value));
  const change = (value: number | null | undefined) => setPending(value);
  const commit = () => {
    const value = pending();
    if (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value !== props.value
    )
      props.commit(value);
  };
  const keyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      event.stopPropagation();
      commit();
    }
  };
  return (
    <div class={styles.field} onFocusOut={commit} on:keydown={keyDown}>
      <label for={`${props.id}-input`}>{props.label}</label>
      <div class={styles.number}>
        <NumberField
          id={props.id}
          size="xs"
          min={props.limits.min}
          max={props.limits.max}
          step={100}
          value={pending()}
          onChange={change}
        />
      </div>
    </div>
  );
}
export function SegmentDetails() {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const segment = () =>
    animation
      .segments()
      .find(
        segment =>
          segment.stepId === animation.selection()?.stepId &&
          segment.kind === animation.selection()?.kind,
      );
  const name = () => {
    const value = segment();
    return value
      ? editor.state.editors.find(
          tab => tab.id === animation.settings().steps[value.index].editorId,
        )?.tab.tabName || t('animation.untitledTab')
      : '';
  };
  const label = () => {
    const value = segment();
    return value?.kind === 'hold'
      ? t('animation.stepName', {n: String(value.index + 1), tab: name()})
      : t('animation.betweenSteps', {
          from: String(value?.index ?? 0),
          to: String((value?.index ?? 0) + 1),
        });
  };
  const commit = (ms: number) => {
    const value = segment();
    if (!value) return;
    if (value.kind === 'hold') animation.actions.setHoldMs(value.stepId, ms);
    else animation.actions.setTransition(value.stepId, {ms});
  };
  const apply = () => {
    const value = segment();
    if (value) animation.actions.applyToAll(value.stepId);
  };
  const allMatch = () => {
    const value = segment();
    if (!value) return true;
    const settings = animation.settings();
    const transition = transitionOf(settings, settings.steps[value.index]);
    return (
      settings.transitionMs === transition.ms &&
      settings.easing === transition.easing &&
      settings.steps.slice(1).every(step => {
        const other = transitionOf(settings, step);
        return other.ms === transition.ms && other.easing === transition.easing;
      })
    );
  };
  return (
    <div class={styles.details}>
      <Show
        when={segment()}
        fallback={<p class={styles.hint}>{t('animation.selectHint')}</p>}
      >
        <span>{label()}</span>
        <DurationInput
          id="animationDuration"
          label={
            segment()?.kind === 'hold'
              ? t('animation.hold')
              : t('animation.transition')
          }
          value={segment()?.durationMs ?? 0}
          limits={
            segment()?.kind === 'hold'
              ? DURATION_LIMITS.holdMs
              : DURATION_LIMITS.transitionMs
          }
          commit={commit}
        />
        <Show
          when={segment()?.kind === 'transition' && segment()?.stepId}
          keyed
        >
          {stepId => (
            <>
              <EasingField stepId={stepId} />
              <Button
                size="xs"
                theme="secondary"
                disabled={allMatch()}
                onClick={apply}
              >
                {t('animation.applyAll')}
              </Button>
            </>
          )}
        </Show>
      </Show>
    </div>
  );
}
