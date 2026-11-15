import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import type {AnimationSegment} from '@codeimage/store/editor/animationSettings';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createMemo, For} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {formatDuration, formatSeconds} from './format';
import * as styles from './StripTimeline.css';
function Segment(props: {segment: AnimationSegment; total: number}) {
  const {animation, editor} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const segment = () => props.segment;
  const name = () =>
    editor.state.editors.find(
      tab => tab.id === animation.settings().steps[segment().index].editorId,
    )?.tab.tabName || t('animation.untitledTab');
  const label = () =>
    segment().kind === 'hold'
      ? t('animation.stepName', {n: String(segment().index + 1), tab: name()})
      : t('animation.betweenSteps', {
          from: String(segment().index),
          to: String(segment().index + 1),
        });
  const select = () =>
    animation.actions.select({stepId: segment().stepId, kind: segment().kind});
  const selected = () =>
    animation.selection()?.stepId === segment().stepId &&
    animation.selection()?.kind === segment().kind;
  const current = () =>
    animation.playback().state !== 'editing' &&
    animation.playhead() >= segment().startMs &&
    animation.playhead() < segment().startMs + segment().durationMs;
  return (
    <button
      type="button"
      class={styles.segment}
      data-animation-segment
      data-step-id={segment().stepId}
      data-kind={segment().kind}
      data-selected={selected() ? '' : undefined}
      data-current={current() ? '' : undefined}
      aria-label={label()}
      title={`${label()} · ${formatDuration(segment().durationMs, locale())}`}
      style={assignInlineVars({
        [styles.fraction]: `${(segment().durationMs / props.total) * 100}%`,
      })}
      onClick={select}
      onFocus={select}
    >
      <span class={styles.label}>
        {segment().kind === 'hold'
          ? `${segment().index + 1} · ${name()}`
          : formatDuration(segment().durationMs, locale())}
      </span>
    </button>
  );
}
export function StripTimeline() {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  let ruler!: HTMLDivElement;
  const ticks = createMemo(() => {
    const step = animation.durationMs() > 4500 ? 1000 : 500;
    return Array.from(
      {length: Math.floor(animation.durationMs() / step) + 1},
      (_, i) => i * step,
    );
  });
  const at = (event: PointerEvent) => {
    const box = ruler.getBoundingClientRect();
    return Math.max(
      0,
      Math.min(
        animation.durationMs(),
        ((event.clientX - box.left) / box.width) * animation.durationMs(),
      ),
    );
  };
  const pointerDown = (event: PointerEvent) => {
    event.preventDefault();
    ruler.focus();
    ruler.setPointerCapture(event.pointerId);
    animation.actions.scrub(at(event));
  };
  const pointerMove = (event: PointerEvent) => {
    if (ruler.hasPointerCapture(event.pointerId))
      animation.actions.scrub(at(event));
  };
  const pointerUp = (event: PointerEvent) => {
    if (!ruler.hasPointerCapture(event.pointerId)) return;
    animation.actions.seek(at(event));
    ruler.releasePointerCapture(event.pointerId);
  };
  const keyDown = (event: KeyboardEvent) => {
    const amount = event.shiftKey ? 100 : 1000 / animation.settings().fps;
    if (event.key === 'ArrowLeft')
      animation.actions.seek(animation.playhead() - amount);
    else if (event.key === 'ArrowRight')
      animation.actions.seek(animation.playhead() + amount);
    else if (event.key === 'Home') animation.actions.seek(0);
    else if (event.key === 'End')
      animation.actions.seek(animation.durationMs());
    else return;
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <div>
      <div
        ref={ruler}
        class={styles.ruler}
        role="slider"
        tabIndex={0}
        aria-label={t('animation.playhead')}
        aria-valuemin={0}
        aria-valuemax={animation.durationMs()}
        aria-valuenow={Math.round(animation.playhead())}
        aria-valuetext={formatSeconds(animation.playhead(), locale())}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        on:keydown={keyDown}
      >
        <For each={ticks()}>
          {ms => (
            <span
              class={styles.tick}
              style={assignInlineVars({
                [styles.position]: `${(ms / animation.durationMs()) * 100}%`,
              })}
            >
              {formatSeconds(ms, locale())}
            </span>
          )}
        </For>
        <span
          class={styles.playhead}
          style={assignInlineVars({
            [styles.position]: `${(animation.playhead() / animation.durationMs()) * 100}%`,
          })}
        />
      </div>
      <div class={styles.track}>
        <For each={animation.segments()}>
          {segment => (
            <Segment segment={segment} total={animation.durationMs()} />
          )}
        </For>
      </div>
    </div>
  );
}
