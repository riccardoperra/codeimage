import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {SvgIcon} from '@codeimage/ui';
import {createMemo, For, Show} from 'solid-js';
import type {JSX} from '@solidjs/web';
import {selectionVersion} from '../../CustomEditor/plugins/selection';
import {
  applyLineAction,
  lineActionState,
  selectedLines,
} from '../scriptActions';
import * as styles from './toolbar.css';

const icon = (path: JSX.Element) => () => (
  <SvgIcon
    class={styles.actionIcon}
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
  const lines = createMemo(() => {
    selectionVersion();
    return selectedLines(store, props.editorId);
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
    let range = '';
    if (line.leave !== undefined)
      range = t('animation.timeline.lineVisibleRange', {
        from: String(from),
        to: String(line.leave - 1),
      });
    else if (from > 1)
      range = t('animation.timeline.lineVisibleFrom', {n: String(from)});
    return [
      range,
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
              <button
                type="button"
                class={styles.segment}
                title={t(`animation.timeline.${item.tip}`, {
                  step: String(props.step),
                })}
                aria-pressed={pressed() ? 'true' : 'false'}
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
                }}
              >
                <item.Icon />
                {t(`animation.timeline.${item.label}`)}
              </button>
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
