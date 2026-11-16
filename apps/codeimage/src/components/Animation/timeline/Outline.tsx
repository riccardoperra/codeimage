import {OutlineTab} from './OutlineTab';
import type {Context} from './OutlineRows';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {createSignal, For, onCleanup, onMount, untrack} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {registerRoot, timelineActions} from './actions';
import {keyOf, type TimelineModel} from './model';
import {createListViewport} from './minimap';
import {createIndicator} from './motion';
import * as shared from './shared.css';
import * as styles from './Outline.css';

export function Outline(props: {model: TimelineModel}) {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
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
          {(editorId, index) => (
            <OutlineTab
              {...context}
              editorId={editorId}
              index={index()}
              list={() => list}
              dragging={dragging()}
              onDrag={setDragging}
            />
          )}
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
