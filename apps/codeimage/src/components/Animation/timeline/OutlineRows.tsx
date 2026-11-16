import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Show} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {EasingCurve} from '../EasingCurve';
import {formatDuration, formatSeconds} from '../format';
import {openStepMenu} from './actions';
import {navKeyDown, tabStopOf} from './keys';
import {type TimelineModel} from './model';
import * as shared from './shared.css';
import {openTransition} from './TransitionPopover';
import * as styles from './Outline.css';

export type Context = {
  model: TimelineModel;
  root: () => HTMLElement | undefined;
  selectedKey: () => string | null;
  firstKey: () => string;
};

export function TransitionRow(
  props: Context & {stepId: string; between?: boolean},
) {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const step = () => props.model.stepOf(props.stepId);
  const key = () => `transition:${props.stepId}`;
  const select = () =>
    animation.actions.select({stepId: props.stepId, kind: 'transition'});
  return (
    <Show when={step()}>
      {step => {
        return (
          <Show when={step().transition}>
            {transition => (
              <button
                type="button"
                class={styles.transitionRow}
                classList={{
                  [styles.betweenTabs]: !!props.between,
                  [shared.linked]: true,
                }}
                data-flip={`tr:${props.stepId}`}
                data-ring={key()}
                data-nav={key()}
                data-animation-segment
                data-kind="transition"
                data-step-id={props.stepId}
                data-current={
                  props.model.isCurrent(transition()) ? '' : undefined
                }
                data-linked={props.model.linked(props.stepId) ? '' : undefined}
                aria-pressed={props.selectedKey() === key()}
                aria-label={t('animation.timeline.transitionInto', {
                  step: step().label,
                  duration: formatDuration(transition().durationMs, locale()),
                })}
                tabIndex={tabStopOf(
                  props.selectedKey(),
                  key(),
                  props.firstKey(),
                )}
                onClick={event => {
                  select();
                  openTransition(event, props.stepId);
                }}
                onFocus={select}
                onContextMenu={event => openStepMenu(event, select)}
                onKeyDown={event =>
                  navKeyDown(event, {
                    root: props.root(),
                    step: step(),
                    kind: 'transition',
                  })
                }
              >
                <span aria-hidden="true">↓</span>
                <EasingCurve
                  easing={step().easing}
                  class={styles.glyph}
                  glyph
                />
                {formatDuration(transition().durationMs, locale())}{' '}
                {t(`animation.easing.${easingLabel(step().easingName)}`)}
                <Show when={props.model.isCurrent(transition())}>
                  <span
                    class={shared.progress}
                    style={{
                      transform: `scaleX(${props.model.progressOf(transition())})`,
                    }}
                  />
                </Show>
              </button>
            )}
          </Show>
        );
      }}
    </Show>
  );
}

export function StepRow(props: Context & {stepId: string}) {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const step = () => props.model.stepOf(props.stepId);
  const key = () => `hold:${props.stepId}`;
  const select = () =>
    animation.actions.select({stepId: props.stepId, kind: 'hold'});
  return (
    <Show when={step()}>
      {step => {
        return (
          <button
            type="button"
            class={`${styles.row} ${styles.stepRow} ${shared.linked}`}
            data-flip={`step:${props.stepId}`}
            data-ring={key()}
            data-nav={key()}
            data-animation-segment
            data-kind="hold"
            data-step-id={props.stepId}
            data-current={props.model.isCurrent(step().hold) ? '' : undefined}
            data-linked={props.model.linked(props.stepId) ? '' : undefined}
            aria-pressed={props.selectedKey() === key()}
            aria-label={`${step().label} · ${step().long}`}
            tabIndex={tabStopOf(props.selectedKey(), key(), props.firstKey())}
            onClick={select}
            onFocus={select}
            onContextMenu={event => openStepMenu(event, select)}
            onKeyDown={event =>
              navKeyDown(event, {
                root: props.root(),
                step: step(),
                kind: 'hold',
              })
            }
          >
            <span class={styles.name}>
              {t('animation.timeline.stepNumber', {n: String(step().sub)})}
            </span>
            <span class={styles.meta}>{step().long}</span>
            <span class={styles.time}>
              {formatSeconds(step().hold.durationMs, locale())}
            </span>
            <Show when={props.model.isCurrent(step().hold)}>
              <span
                class={shared.progress}
                style={{
                  transform: `scaleX(${props.model.progressOf(step().hold)})`,
                }}
              />
            </Show>
          </button>
        );
      }}
    </Show>
  );
}

export const Grip = () => (
  <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
    <circle cx="3" cy="3" r="1.4" />
    <circle cx="7" cy="3" r="1.4" />
    <circle cx="3" cy="8" r="1.4" />
    <circle cx="7" cy="8" r="1.4" />
    <circle cx="3" cy="13" r="1.4" />
    <circle cx="7" cy="13" r="1.4" />
  </svg>
);

function easingLabel(value: string) {
  if (value.startsWith('cubic-bezier')) return 'custom';
  switch (value) {
    case 'snappy':
    case 'strong':
    case 'linear':
      return value;
    default:
      return 'smooth';
  }
}
