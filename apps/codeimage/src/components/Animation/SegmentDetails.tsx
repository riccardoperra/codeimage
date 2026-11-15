import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {
  DURATION_LIMITS,
  transitionOf,
} from '@codeimage/store/editor/animationSettings';
import {Button, icons, TextField} from '@codeui/kit';
import {createEffect, createMemo, createSignal, Show, untrack} from 'solid-js';
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
  const [t] = useI18n<AppLocaleEntries>();
  const [pending, setPending] = createSignal(
    untrack(() => String(props.value)),
  );
  createEffect(() => setPending(String(props.value)));
  const numericValue = () =>
    pending().trim() ? Number(pending()) : props.value;
  const save = (value: number) => {
    const next = Number.isFinite(value)
      ? Math.max(
          props.limits.min,
          Math.min(props.limits.max, Math.round(value)),
        )
      : props.value;
    setPending(String(next));
    if (next !== props.value) props.commit(next);
  };
  const commit = () => save(numericValue());
  const increase = () => save(numericValue() + 100);
  const decrease = () => save(numericValue() - 100);
  const keyDown = (event: KeyboardEvent) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (!['Escape', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key))
      return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Escape') setPending(String(props.value));
    else if (event.key === 'ArrowUp') increase();
    else if (event.key === 'ArrowDown') decrease();
    else commit();
  };
  const pointerDown = (event: PointerEvent) => {
    if (event.target instanceof Element && event.target.closest('button'))
      event.preventDefault();
  };
  const configureInput = (input: HTMLInputElement) => {
    input.inputMode = 'numeric';
  };
  return (
    <div
      class={styles.field}
      onFocusOut={commit}
      on:keydown={keyDown}
      onPointerDown={pointerDown}
    >
      <label for={`${props.id}-input`}>{props.label}</label>
      <div class={styles.number}>
        <TextField
          ref={configureInput}
          id={props.id}
          size="xs"
          value={pending()}
          onChange={setPending}
        />
        <div class={styles.durationSteppers}>
          <Button
            type="button"
            size="xs"
            theme="secondary"
            variant="ghost"
            tabIndex={-1}
            aria-label={t('animation.increaseDuration')}
            disabled={numericValue() >= props.limits.max}
            onClick={increase}
          >
            <icons.ChevronUpIcon />
          </Button>
          <Button
            type="button"
            size="xs"
            theme="secondary"
            variant="ghost"
            tabIndex={-1}
            aria-label={t('animation.decreaseDuration')}
            disabled={numericValue() <= props.limits.min}
            onClick={decrease}
          >
            <icons.ChevronDownIcon />
          </Button>
        </div>
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
  const limits = createMemo(() =>
    segment()?.kind === 'hold'
      ? DURATION_LIMITS.holdMs
      : DURATION_LIMITS.transitionMs,
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
    if (allMatch()) return;
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
          limits={limits()}
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
                aria-disabled={allMatch()}
                data-disabled={allMatch() ? '' : undefined}
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
