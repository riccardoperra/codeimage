import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  untrack,
} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {EasingCurve} from '../EasingCurve';
import {formatDuration} from '../format';
import {openStepMenu, registerRoot, timelineActions} from './actions';
import {navKeyDown, tabStopOf} from './keys';
import {keyOf, projectedCode, type TimelineModel} from './model';
import {createListViewport} from './minimap';
import {createIndicator, startReorder} from './motion';
import * as shared from './shared.css';
import {openTransition} from './TransitionPopover';
import * as styles from './Filmstrip.css';

type Context = {
  model: TimelineModel;
  root: () => HTMLElement | undefined;
  selectedKey: () => string | null;
  firstKey: () => string;
};

function Card(props: Context & {stepId: string}) {
  const {animation} = getEditorStore();
  const step = () => props.model.stepOf(props.stepId)!;
  const key = () => `hold:${props.stepId}`;
  const select = () =>
    animation.actions.select({stepId: props.stepId, kind: 'hold'});
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
        navKeyDown(event, {root: props.root(), step: step(), kind: 'hold'})
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
          style={{transform: `scaleX(${props.model.progressOf(step().hold)})`}}
        />
      </Show>
    </button>
  );
}

function Chip(props: Context & {stepId: string; between?: boolean}) {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const step = () => props.model.stepOf(props.stepId)!;
  const key = () => `transition:${props.stepId}`;
  const select = () =>
    animation.actions.select({stepId: props.stepId, kind: 'transition'});
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
          <EasingCurve easing={step().easing} glyph />
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
}

export function Filmstrip(props: {model: TimelineModel}) {
  const [t] = useI18n<AppLocaleEntries>();
  const {animation} = getEditorStore();
  const actions = timelineActions();
  let root: HTMLDivElement | undefined;
  let row: HTMLDivElement | undefined;
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
  untrack(() => createListViewport(props.model, () => root, 'x'));
  const context: Context = {
    model: untrack(() => props.model),
    root: () => root,
    selectedKey,
    firstKey,
  };
  return (
    <div
      class={styles.root}
      ref={root}
      data-timeline="filmstrip"
      data-animation-track
    >
      <span class={shared.ring} ref={ring} aria-hidden="true" />
      <div
        class={styles.row}
        ref={row}
        role="list"
        aria-label={t('animation.steps')}
      >
        <For each={props.model.tabIds()}>
          {(editorId, index) => {
            const tab = () => props.model.tabOf(editorId)!;
            let item!: HTMLDivElement;
            const drag = (event: PointerEvent) =>
              startReorder(event, {
                item,
                root: row!,
                selector: '[data-reorder]',
                axis: 'x',
                ignore: 'button',
                onDrop: to => animation.actions.moveTab(editorId, to),
                onDrag: value => setDragging(value ? editorId : null),
              });
            return (
              <div
                ref={item}
                class={styles.cards}
                data-reorder
                data-flip={`tab:${editorId}`}
                data-tab-group={editorId}
              >
                <Show when={index() > 0 && tab()}>
                  <Chip {...context} stepId={tab().steps[0].stepId} between />
                </Show>
                <div
                  class={styles.tab}
                  data-dragging={dragging() === editorId ? '' : undefined}
                >
                  <div
                    class={styles.tabHeader}
                    onPointerDown={drag}
                    title={t('animation.timeline.drag')}
                  >
                    <span class={styles.tabNumber}>{tab()?.position}</span>
                    <span class={styles.tabName}>{tab()?.name}</span>
                    <Show when={(tab()?.steps.length ?? 0) > 1}>
                      <span class={styles.tabMeta}>
                        {t('animation.timeline.stepsCount', {
                          n: String(tab()!.steps.length),
                        })}
                      </span>
                    </Show>
                  </div>
                  <div class={styles.cards}>
                    <For each={props.model.stepIdsOf(editorId)}>
                      {(stepId, inner) => (
                        <>
                          <Show when={inner() > 0}>
                            <Chip {...context} stepId={stepId} />
                          </Show>
                          <Card {...context} stepId={stepId} />
                        </>
                      )}
                    </For>
                    <button
                      type="button"
                      class={styles.ghost}
                      aria-label={t('animation.timeline.addStepTo', {
                        tab: tab()?.name ?? '',
                      })}
                      title={t('animation.timeline.addStepTo', {
                        tab: tab()?.name ?? '',
                      })}
                      data-add-script-step={editorId}
                      onClick={() => actions.addStep(editorId)}
                    >
                      <span class={styles.ghostHead}>
                        <span class={styles.cardNumber}>
                          {(tab()?.steps.length ?? 0) + 1}
                        </span>
                        {t('animation.timeline.addStep')}
                      </span>
                      <span class={styles.ghostHint}>
                        {t('animation.timeline.scriptHint')}
                      </span>
                    </button>
                  </div>
                </div>
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
