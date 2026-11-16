import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {SvgIcon} from '@codeimage/ui';
import {Tooltip} from '@codeui/kit';
import {createSignal, For, onCleanup, onMount, Show, type JSX} from 'solid-js';
import {
  applyLineAction,
  lineActionState,
  selectedLines,
} from '../scriptActions';
import * as styles from './toolbar.css';

const icon = (path: JSX.Element) => () => (
  <SvgIcon
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
  >
    {path}
  </SvgIcon>
);

const ACTIONS = [
  {
    action: 'enter',
    label: 'lineEnter',
    tip: 'enterTip',
    Icon: icon(<path d="M8 3v10M3 8h10" />),
  },
  {
    action: 'leave',
    label: 'lineLeave',
    tip: 'leaveTip',
    Icon: icon(<path d="M3 8h10" />),
  },
  {
    action: 'focus',
    label: 'lineFocus',
    tip: 'focusTip',
    Icon: icon(
      <>
        <circle cx="8" cy="8" r="5" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      </>,
    ),
  },
] as const;

export function LineActions(props: {editorId: string; step: number}) {
  const store = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const [lines, setLines] = createSignal<number[]>([]);
  const read = () => setLines(selectedLines(store, props.editorId));
  onMount(() => {
    read();
    document.addEventListener('selectionchange', read);
    document.addEventListener('keyup', read);
    document.addEventListener('pointerup', read);
    onCleanup(() => {
      document.removeEventListener('selectionchange', read);
      document.removeEventListener('keyup', read);
      document.removeEventListener('pointerup', read);
    });
  });
  const range = () => {
    const value = lines();
    if (!value.length) return t('animation.timeline.selectLines');
    const first = Math.min(...value);
    const last = Math.max(...value);
    return first === last
      ? t('animation.timeline.line', {n: String(first)})
      : t('animation.timeline.lineRange', {
          from: String(first),
          to: String(last),
        });
  };
  const summary = () => {
    const value = lines();
    if (value.length !== 1) return '';
    const line = store.editor.state.editors
      .find(tab => tab.id === props.editorId)
      ?.marks.script?.lines.find(line => line.line === value[0]);
    if (!line) return '';
    const from = line.enter ?? 1;
    return [
      line.leave !== undefined
        ? t('animation.timeline.lineVisibleRange', {
            from: String(from),
            to: String(line.leave - 1),
          })
        : from > 1
          ? t('animation.timeline.lineVisibleFrom', {n: String(from)})
          : '',
      line.focus?.length
        ? t('animation.timeline.lineFocusIn', {steps: line.focus.join(', ')})
        : '',
    ]
      .filter(Boolean)
      .join(' · ');
  };
  return (
    <div class={styles.group} data-script-controls>
      <span class={styles.muted}>
        {lines().length
          ? t('animation.timeline.lineInStep', {
              lines: range(),
              step: String(props.step),
            })
          : range()}
      </span>
      <div
        class={styles.segmented}
        role="group"
        aria-label={t('animation.timeline.lineChanges')}
      >
        <For each={ACTIONS}>
          {item => {
            const pressed = () =>
              lineActionState(props.editorId, lines(), item.action, props.step);
            return (
              <Tooltip
                content={t(`animation.timeline.${item.tip}`, {
                  step: String(props.step),
                })}
                placement="top"
              >
                <button
                  type="button"
                  class={styles.segment}
                  aria-pressed={pressed()}
                  aria-label={t(`animation.timeline.${item.tip}`, {
                    step: String(props.step),
                  })}
                  data-script-action={item.action}
                  disabled={
                    !lines().length ||
                    (props.step === 1 && item.action !== 'focus')
                  }
                  onPointerDown={event => event.preventDefault()}
                  onClick={() => {
                    applyLineAction(
                      store,
                      props.editorId,
                      item.action,
                      props.step,
                    );
                    read();
                  }}
                >
                  <item.Icon />
                  {t(`animation.timeline.${item.label}`)}
                </button>
              </Tooltip>
            );
          }}
        </For>
      </div>
      <Show when={summary()}>
        <span class={styles.muted} data-script-line-summary>
          {summary()}
        </span>
      </Show>
    </div>
  );
}
