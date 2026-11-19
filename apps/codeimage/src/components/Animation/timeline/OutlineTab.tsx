import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {For, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {formatSeconds} from '../format';
import {openStepMenu, timelineActions} from './actions';
import {navKeyDown, tabStopOf} from './keys';
import {startReorder} from './motion';
import type {TimelineStep, TimelineTab} from './model';
import {TransitionRow, StepRow, Grip, type Context} from './OutlineRows';
import * as shared from './shared.css';
import * as styles from './Outline.css';
type TabProps = Context & {
  editorId: string;
  index: number;
  list: () => HTMLElement | undefined;
  dragging: string | null;
  onDrag: (id: string | null) => void;
};
function TabHeader(
  props: TabProps & {
    single: () => boolean;
    first: () => TimelineStep | undefined;
    tab: () => TimelineTab | undefined;
    headKey: () => string;
    drag: (event: PointerEvent) => void;
    selectFirst: () => void;
  },
) {
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const actions = timelineActions();
  const navigation = () => {
    const step = props.single() ? props.first() : undefined;
    const pressed: 'true' | 'false' =
      props.selectedKey() === props.headKey() ? 'true' : 'false';
    return {
      'data-nav': step ? props.headKey() : undefined,
      'data-animation-segment': step ? '' : undefined,
      'data-kind': step ? ('hold' as const) : undefined,
      'data-step-id': step?.stepId,
      'aria-pressed': step && pressed,
      tabindex: step
        ? tabStopOf(props.selectedKey(), props.headKey(), props.firstKey())
        : -1,
    };
  };
  const meta = () =>
    props.single()
      ? props.first()?.long
      : t('animation.timeline.stepsCount', {
          n: String(props.tab()?.steps.length),
        });
  const addLabel = () =>
    t('animation.timeline.addStepTo', {tab: props.tab()?.name ?? ''});
  return (
    <div
      class={`${styles.row} ${styles.tabRow} ${shared.linked}`}
      data-ring={props.single() ? props.headKey() : undefined}
      data-flip={props.single() ? `step:${props.first()?.stepId}` : undefined}
      data-linked={
        props.single() && props.model.linked(props.first()?.stepId ?? '')
          ? ''
          : undefined
      }
      data-current={
        props.single() && props.model.isCurrent(props.first()?.hold ?? null)
          ? ''
          : undefined
      }
      onContextMenu={event => openStepMenu(event, props.selectFirst)}
    >
      <span
        class={styles.grip}
        onPointerDown={event => props.drag(event)}
        title={t('animation.timeline.drag')}
        aria-hidden="true"
      >
        <Grip />
      </span>
      <button
        type="button"
        class={styles.rowButton}
        {...navigation()}
        onClick={() => props.selectFirst()}
        onFocus={() => props.single() && props.selectFirst()}
        onKeyDown={event => {
          const step = props.first();
          if (props.single() && step)
            navKeyDown(event, {root: props.root(), step, kind: 'hold'});
        }}
      >
        <span class={styles.number}>{props.tab()?.position}</span>
        <span class={styles.name}>{props.tab()?.name}</span>
        <span class={styles.meta}>{meta()}</span>
        <Show when={props.single() && props.first()}>
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
        aria-label={addLabel()}
        title={addLabel()}
        data-add-script-step={props.editorId}
        onClick={() => actions.addStep(props.editorId)}
      >
        + {t('animation.timeline.ghostTitle')}
      </button>
      <Show when={props.single() && props.first()}>
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
  );
}

export function OutlineTab(props: TabProps) {
  const {animation} = getEditorStore();
  const tab = () => props.model.tabOf(props.editorId);
  const single = () => tab()?.steps.length === 1;
  const first = () => tab()?.steps[0];
  let item: HTMLDivElement | undefined;
  const drag = (event: PointerEvent) => {
    const list = props.list();
    if (!item || !list) return;
    startReorder(event, {
      item,
      root: list,
      selector: '[data-reorder]',
      axis: 'y',
      onDrop: to => animation.actions.moveTab(props.editorId, to),
      onDrag: value => props.onDrag(value ? props.editorId : null),
    });
  };
  const selectFirst = () => {
    const step = first();
    if (step) animation.actions.select({stepId: step.stepId, kind: 'hold'});
  };
  const headKey = () => (single() ? `hold:${first()?.stepId}` : '');
  return (
    <div
      ref={item}
      class={styles.tab}
      role="listitem"
      data-reorder
      data-flip={`tab:${props.editorId}`}
      data-tab-group={props.editorId}
      data-dragging={props.dragging === props.editorId ? '' : undefined}
    >
      <Show when={props.index > 0 && first()}>
        {step => <TransitionRow {...props} stepId={step().stepId} between />}
      </Show>
      <TabHeader
        {...props}
        single={single}
        first={first}
        tab={tab}
        headKey={headKey}
        drag={drag}
        selectFirst={selectFirst}
      />
      <Show when={!single()}>
        <For each={props.model.stepIdsOf(props.editorId)}>
          {(stepId, inner) => (
            <>
              <Show when={inner() > 0}>
                <TransitionRow {...props} stepId={stepId} />
              </Show>
              <StepRow {...props} stepId={stepId} />
            </>
          )}
        </For>
      </Show>
    </div>
  );
}
