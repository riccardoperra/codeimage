import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {createSignal, For, onCleanup, onMount, Show, untrack} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {EasingCurve} from '../EasingCurve';
import {formatDuration, formatSeconds} from '../format';
import {openStepMenu, registerRoot, timelineActions} from './actions';
import {navKeyDown, tabStopOf} from './keys';
import {keyOf, type TimelineModel} from './model';
import {createListViewport} from './minimap';
import {createIndicator, startReorder} from './motion';
import * as shared from './shared.css';
import {openTransition} from './TransitionPopover';
import * as styles from './Outline.css';

type Context = {
  model: TimelineModel;
  root: () => HTMLElement | undefined;
  selectedKey: () => string | null;
  firstKey: () => string;
};

function TransitionRow(props: Context & {stepId: string; between?: boolean}) {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const step = () => props.model.stepOf(props.stepId)!;
  const key = () => `transition:${props.stepId}`;
  const select = () =>
    animation.actions.select({stepId: props.stepId, kind: 'transition'});
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
          data-current={props.model.isCurrent(transition()) ? '' : undefined}
          data-linked={props.model.linked(props.stepId) ? '' : undefined}
          aria-pressed={props.selectedKey() === key()}
          aria-label={t('animation.timeline.transitionInto', {
            step: step().label,
            duration: formatDuration(transition().durationMs, locale()),
          })}
          tabIndex={tabStopOf(props.selectedKey(), key(), props.firstKey())}
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
          <EasingCurve easing={step().easing} glyph />
          {formatDuration(transition().durationMs, locale())}{' '}
          {t(
            `animation.easing.${step().easingName.startsWith('cubic-bezier') ? 'custom' : step().easingName === 'snappy' ? 'snappy' : step().easingName === 'strong' ? 'strong' : step().easingName === 'linear' ? 'linear' : 'smooth'}`,
          )}
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
}

function StepRow(props: Context & {stepId: string}) {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const step = () => props.model.stepOf(props.stepId)!;
  const key = () => `hold:${props.stepId}`;
  const select = () =>
    animation.actions.select({stepId: props.stepId, kind: 'hold'});
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
        navKeyDown(event, {root: props.root(), step: step(), kind: 'hold'})
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
}

const Grip = () => (
  <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
    <circle cx="3" cy="3" r="1.4" />
    <circle cx="7" cy="3" r="1.4" />
    <circle cx="3" cy="8" r="1.4" />
    <circle cx="7" cy="8" r="1.4" />
    <circle cx="3" cy="13" r="1.4" />
    <circle cx="7" cy="13" r="1.4" />
  </svg>
);

export function Outline(props: {model: TimelineModel}) {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const actions = timelineActions();
  let root: HTMLDivElement | undefined;
  let list: HTMLDivElement | undefined;
  let ring: HTMLSpanElement | undefined;
  onMount(() => registerRoot(root));
  onCleanup(() => registerRoot(undefined));
  const [dragging, setDragging] = createSignal<string | null>(null);
  const selectedKey = () => {
    const value = animation.selection();
    return value ? keyOf(value) : null;
  };
  const firstKey = () => {
    const first = props.model.steps()[0];
    return first ? `hold:${first.stepId}` : '';
  };
  createIndicator({
    root: () => root,
    ring: () => ring,
    target: selectedKey,
    layout: () => [props.model.tabs(), dragging()],
  });
  untrack(() => createListViewport(props.model, () => root, 'y'));
  const context: Context = {
    model: untrack(() => props.model),
    root: () => root,
    selectedKey,
    firstKey,
  };
  return (
    <div class={styles.root} ref={root} data-timeline="outline">
      <span class={shared.ring} ref={ring} aria-hidden="true" />
      <div
        class={styles.list}
        ref={list}
        role="list"
        aria-label={t('animation.steps')}
        data-animation-track
      >
        <For each={props.model.tabIds()}>
          {(editorId, index) => {
            const tab = () => props.model.tabOf(editorId)!;
            const single = () => tab()?.steps.length === 1;
            const first = () => tab()?.steps[0];
            let item!: HTMLDivElement;
            const drag = (event: PointerEvent) =>
              startReorder(event, {
                item,
                root: list!,
                selector: '[data-reorder]',
                axis: 'y',
                onDrop: to => animation.actions.moveTab(editorId, to),
                onDrag: value => setDragging(value ? editorId : null),
              });
            const selectFirst = () => {
              const step = first();
              if (step)
                animation.actions.select({stepId: step.stepId, kind: 'hold'});
            };
            const headKey = () => (single() ? `hold:${first()?.stepId}` : '');
            return (
              <div
                ref={item}
                class={styles.tab}
                role="listitem"
                data-reorder
                data-flip={`tab:${editorId}`}
                data-tab-group={editorId}
                data-dragging={dragging() === editorId ? '' : undefined}
              >
                <Show when={index() > 0 && first()}>
                  {step => (
                    <TransitionRow
                      {...context}
                      stepId={step().stepId}
                      between
                    />
                  )}
                </Show>
                <div
                  class={`${styles.row} ${styles.tabRow} ${shared.linked}`}
                  data-ring={single() ? headKey() : undefined}
                  data-flip={single() ? `step:${first()?.stepId}` : undefined}
                  data-linked={
                    single() && props.model.linked(first()?.stepId ?? '')
                      ? ''
                      : undefined
                  }
                  data-current={
                    single() && props.model.isCurrent(first()?.hold ?? null)
                      ? ''
                      : undefined
                  }
                  onContextMenu={event => openStepMenu(event, selectFirst)}
                >
                  <span
                    class={styles.grip}
                    onPointerDown={drag}
                    title={t('animation.timeline.drag')}
                    aria-hidden="true"
                  >
                    <Grip />
                  </span>
                  <button
                    type="button"
                    class={styles.rowButton}
                    data-nav={single() ? headKey() : undefined}
                    data-animation-segment={single() ? '' : undefined}
                    data-kind={single() ? 'hold' : undefined}
                    data-step-id={single() ? first()?.stepId : undefined}
                    aria-pressed={single() && selectedKey() === headKey()}
                    tabIndex={
                      single()
                        ? tabStopOf(selectedKey(), headKey(), firstKey())
                        : -1
                    }
                    onClick={selectFirst}
                    onFocus={() => single() && selectFirst()}
                    onKeyDown={event => {
                      const step = first();
                      if (single() && step)
                        navKeyDown(event, {root, step, kind: 'hold'});
                    }}
                  >
                    <span class={styles.number}>{tab()?.position}</span>
                    <span class={styles.name}>{tab()?.name}</span>
                    <span class={styles.meta}>
                      {single()
                        ? first()?.long
                        : t('animation.timeline.stepsCount', {
                            n: String(tab()?.steps.length),
                          })}
                    </span>
                    <Show when={single() && first()}>
                      {step => (
                        <span class={styles.time}>
                          {formatSeconds(step().hold.durationMs, locale())}
                        </span>
                      )}
                    </Show>
                  </button>
                  <button
                    type="button"
                    class={styles.add}
                    aria-label={t('animation.timeline.addStepTo', {
                      tab: tab()?.name ?? '',
                    })}
                    title={t('animation.timeline.addStepTo', {
                      tab: tab()?.name ?? '',
                    })}
                    data-add-script-step={editorId}
                    onClick={() => actions.addStep(editorId)}
                  >
                    {t('animation.timeline.addStep')}
                  </button>
                  <Show when={single() && first()}>
                    {step => (
                      <Show when={props.model.isCurrent(step().hold)}>
                        <span
                          class={shared.progress}
                          style={{
                            transform: `scaleX(${props.model.progressOf(step().hold)})`,
                          }}
                        />
                      </Show>
                    )}
                  </Show>
                </div>
                <Show when={!single()}>
                  <For each={props.model.stepIdsOf(editorId)}>
                    {(stepId, inner) => (
                      <>
                        <Show when={inner() > 0}>
                          <TransitionRow {...context} stepId={stepId} />
                        </Show>
                        <StepRow {...context} stepId={stepId} />
                      </>
                    )}
                  </For>
                </Show>
              </div>
            );
          }}
        </For>
        <button
          type="button"
          class={styles.addTab}
          disabled={!actions.canAddTab()}
          onClick={actions.addTab}
          data-animation-add-tab
        >
          {t('animation.timeline.addTab')}
        </button>
      </div>
    </div>
  );
}
