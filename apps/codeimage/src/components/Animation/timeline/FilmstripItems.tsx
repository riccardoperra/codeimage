import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {createMemo, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {EasingCurve} from '../EasingCurve';
import {formatDuration} from '../format';
import {openStepMenu} from './actions';
import {navKeyDown, tabStopOf} from './keys';
import {projectedCode, type TimelineModel} from './model';
import * as shared from './shared.css';
import {openTransition} from './TransitionPopover';
import * as styles from './Filmstrip.css';
export type Context = {
  model: TimelineModel;
  root: () => HTMLElement | undefined;
  selectedKey: () => string | null;
  firstKey: () => string;
};

export function Card(props: Context & {stepId: string}) {
  const {animation} = getEditorStore();
  const step = () => props.model.stepOf(props.stepId);
  const key = () => `hold:${props.stepId}`;
  const select = () =>
    animation.actions.select({stepId: props.stepId, kind: 'hold'});
  return (
    <Show when={step()}>
      {step => {
        const code = createMemo(() =>
          projectedCode(step()).split('\n').slice(0, 10).join('\n'),
        );
        const current = () => props.model.isCurrent(step().hold);
        return (
          <button
            type="button"
            class={`${styles.card} ${shared.linked}`}
            role="listitem"
            data-flip={`step:${props.stepId}`}
            data-ring={key()}
            data-nav={key()}
            data-animation-segment
            data-kind="hold"
            data-step-id={props.stepId}
            data-current={current() ? '' : undefined}
            data-linked={props.model.linked(props.stepId) ? '' : undefined}
            aria-pressed={props.selectedKey() === key()}
            aria-label={`${step().label} · ${step().short}`}
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
            <span class={styles.cardHead}>
              <Show when={step().sub}>
                <span class={styles.cardNumber}>{step().sub}</span>
              </Show>
              <span class={styles.cardSummary}>{step().short}</span>
            </span>
            <pre class={styles.code} aria-hidden="true">
              {code()}
            </pre>
            <Show when={current()}>
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

export function Chip(props: Context & {stepId: string; between?: boolean}) {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const step = () => props.model.stepOf(props.stepId);
  const key = () => `transition:${props.stepId}`;
  const select = () =>
    animation.actions.select({stepId: props.stepId, kind: 'transition'});
  return (
    <Show when={step()}>
      {step => {
        const current = () => props.model.isCurrent(step().transition);
        return (
          <Show when={step().transition}>
            {transition => (
              <button
                type="button"
                class={styles.chip}
                classList={{
                  [styles.between]: !!props.between,
                  [shared.linked]: true,
                }}
                data-flip={`tr:${props.stepId}`}
                data-ring={key()}
                data-nav={key()}
                data-animation-segment
                data-kind="transition"
                data-step-id={props.stepId}
                data-current={current() ? '' : undefined}
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
                <EasingCurve
                  easing={step().easing}
                  class={styles.glyph}
                  glyph
                />
                {formatDuration(transition().durationMs, locale())}
                <Show when={current()}>
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
