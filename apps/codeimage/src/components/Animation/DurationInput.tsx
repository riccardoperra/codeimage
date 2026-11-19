import {useI18n} from '@codeimage/locale';
import {Button, TextField} from '@codeimage/ui';
import {icons} from '@ui/kit-icons';
import {createEffect, createSignal, untrack} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import * as styles from './AnimatePanel.css';
export function DurationInput(props: {
  id: string;
  label: string;
  field: 'hold' | 'transition';
  compact?: boolean;
  value: number;
  limits: {min: number; max: number};
  commit: (value: number) => void;
  onEscape?: (event: KeyboardEvent) => void;
}) {
  const [t] = useI18n<AppLocaleEntries>();
  const [pending, setPending] = createSignal(
    untrack(() => String(props.value)),
  );
  createEffect(
    () => props.value,
    value => {
      setPending(String(value));
    },
  );
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
    if (event.key === 'Escape') {
      setPending(String(props.value));
      props.onEscape?.(event);
    } else if (event.key === 'ArrowUp') increase();
    else if (event.key === 'ArrowDown') decrease();
    else commit();
  };
  const pointerDown = (event: PointerEvent) => {
    if (event.target instanceof Element && event.target.closest('button'))
      event.preventDefault();
  };
  return (
    <div
      class={styles.field}
      onFocusOut={commit}
      onKeyDown={keyDown}
      onPointerDown={pointerDown}
    >
      <label class={styles.durationLabel} for={`${props.id}-input`}>
        {props.label}
      </label>
      <div class={styles.number} data-compact={props.compact ? '' : undefined}>
        <TextField
          class={styles.durationInput}
          type="text"
          inputmode="numeric"
          id={`${props.id}-input`}
          size="xs"
          value={pending()}
          onChange={setPending}
        />
        <div class={styles.durationSteppers}>
          <Button
            class={styles.durationButton}
            type="button"
            size="xs"
            theme="secondary"
            variant="link"
            tabindex={-1}
            aria-label={t(
              props.field === 'hold'
                ? 'animation.increaseHold'
                : 'animation.increaseTransition',
            )}
            disabled={numericValue() >= props.limits.max}
            onClick={increase}
          >
            <icons.ChevronUpIcon />
          </Button>
          <Button
            class={styles.durationButton}
            type="button"
            size="xs"
            theme="secondary"
            variant="link"
            tabindex={-1}
            aria-label={t(
              props.field === 'hold'
                ? 'animation.decreaseHold'
                : 'animation.decreaseTransition',
            )}
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
