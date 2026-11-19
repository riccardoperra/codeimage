import {Card, Chip, type Context} from './FilmstripItems';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {createSignal, For, onSettled, Show, untrack} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {registerRoot, timelineActions} from './actions';
import {keyOf, type TimelineModel} from './model';
import {createListViewport} from './minimap';
import {createIndicator, startReorder} from './motion';
import * as shared from './shared.css';
import * as styles from './Filmstrip.css';

export function Filmstrip(props: {model: TimelineModel}) {
  const [t] = useI18n<AppLocaleEntries>();
  const {animation} = getEditorStore();
  const actions = timelineActions();
  let root: HTMLDivElement | undefined;
  let row: HTMLDivElement | undefined;
  let ring: HTMLSpanElement | undefined;
  onSettled(() => registerRoot(root));
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
            const tab = () => props.model.tabOf(editorId);
            let item: HTMLDivElement | undefined;
            const drag = (event: PointerEvent) => {
              if (!item || !row) return;
              startReorder(event, {
                item,
                root: row,
                selector: '[data-reorder]',
                axis: 'x',
                ignore: 'button',
                onDrop: to => animation.actions.moveTab(editorId, to),
                onDrag: value => setDragging(value ? editorId : null),
              });
            };
            return (
              <div
                ref={item}
                class={styles.cards}
                data-reorder
                data-flip={`tab:${editorId}`}
                data-tab-group={editorId}
              >
                <Show when={index() > 0 && tab()}>
                  {tab => (
                    <Chip {...context} stepId={tab().steps[0].stepId} between />
                  )}
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
                          n: String(tab()?.steps.length ?? 0),
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
                        + {t('animation.timeline.ghostTitle')}
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
