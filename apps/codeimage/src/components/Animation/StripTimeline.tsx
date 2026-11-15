import {easingOf} from '@core/animation/easing';
import {transitionOf} from '@codeimage/store/editor/animationSettings';
import {EasingCurve} from './EasingCurve';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {
  DURATION_LIMITS,
  type AnimationSegment,
} from '@codeimage/store/editor/animationSettings';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createResizeObserver} from '@solid-primitives/resize-observer';
import {createMemo, createSignal, For, onMount, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {createSegmentResize} from './createSegmentResize';
import {formatDuration, formatSeconds} from './format';
import * as styles from './StripTimeline.css';
function Segment(props: {
  segment: AnimationSegment;
  total: number;
  resize: (event: PointerEvent, segment: AnimationSegment) => void;
  tabStop: boolean;
  navigate: (event: KeyboardEvent) => void;
}) {
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
  const limits = () =>
    segment().kind === 'hold'
      ? DURATION_LIMITS.holdMs
      : DURATION_LIMITS.transitionMs;
  const keyDown = (event: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      props.navigate(event);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    event.stopPropagation();
    const ms =
      segment().durationMs +
      (event.key === 'ArrowLeft' ? -1 : 1) * (event.altKey ? 10 : 100);
    if (segment().kind === 'hold')
      animation.actions.setHoldMs(segment().stepId, ms);
    else animation.actions.setTransition(segment().stepId, {ms});
  };
  const resize = (event: PointerEvent) => props.resize(event, segment());
  return (
    <button
      type="button"
      role="slider"
      tabIndex={props.tabStop ? 0 : -1}
      aria-valuemin={limits().min}
      aria-valuemax={limits().max}
      aria-valuenow={segment().durationMs}
      aria-valuetext={formatDuration(segment().durationMs, locale())}
      on:keydown={keyDown}
      class={styles.segment}
      data-animation-segment
      data-step-id={segment().stepId}
      data-kind={segment().kind}
      data-selected={selected() ? '' : undefined}
      data-current={current() ? '' : undefined}
      aria-label={label()}
      title={`${label()} · ${formatDuration(segment().durationMs, locale())}`}
      style={assignInlineVars({
        [styles.fraction]: String(segment().durationMs / props.total),
      })}
      onClick={select}
      onFocus={select}
    >
      <Show when={segment().kind === 'transition'}>
        <EasingCurve
          easing={easingOf(
            transitionOf(
              animation.settings(),
              animation.settings().steps[segment().index],
            ).easing,
          )}
          glyph
        />
      </Show>
      <span class={styles.label}>
        {segment().kind === 'hold'
          ? `${segment().index + 1} · ${name()}`
          : formatDuration(segment().durationMs, locale())}
      </span>
      <span
        class={styles.handle}
        data-segment-resize
        aria-hidden="true"
        onPointerDown={resize}
      />
    </button>
  );
}
export function StripTimeline() {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  let ruler!: HTMLDivElement;
  let track!: HTMLDivElement;
  let timeAxis!: HTMLDivElement;
  const [width, setWidth] = createSignal(0);
  onMount(() =>
    createResizeObserver(
      () => timeAxis,
      ({width}) => setWidth(width),
    ),
  );
  const [frozen, setFrozen] = createSignal<number>();
  const axis = () => frozen() ?? animation.durationMs();
  const keys = createMemo(() =>
    animation.segments().map(segment => `${segment.kind}:${segment.stepId}`),
  );
  const tabStop = () => {
    const selected = animation.selection();
    const key = selected && `${selected.kind}:${selected.stepId}`;
    return key && keys().includes(key) ? key : keys()[0];
  };
  const navigate = (event: KeyboardEvent) => {
    const segments = [
      ...track.querySelectorAll<HTMLElement>('[data-animation-segment]'),
    ];
    if (!(event.currentTarget instanceof HTMLElement)) return;
    const index = segments.indexOf(event.currentTarget);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? segments.length - 1
          : Math.max(
              0,
              Math.min(
                segments.length - 1,
                index + (event.key === 'ArrowUp' ? -1 : 1),
              ),
            );
    event.preventDefault();
    event.stopPropagation();
    segments[next]?.focus();
  };
  const minimumWidth = createMemo<number>((previous = 0) =>
    animation.resizing()
      ? previous
      : Math.max(
          0,
          ...animation
            .segments()
            .map(segment =>
              segment.durationMs ? (28 * axis()) / segment.durationMs : 0,
            ),
        ) +
        Math.max(0, keys().length - 1) * 3,
  );
  const resize = createSegmentResize({
    total: animation.durationMs,
    width: () =>
      track.clientWidth - Math.max(0, animation.segments().length - 1) * 3,
    limits: segment =>
      segment.kind === 'hold'
        ? DURATION_LIMITS.holdMs
        : DURATION_LIMITS.transitionMs,
    begin: total => {
      animation.actions.setResizing(true);
      setFrozen(total);
    },
    end: () => {
      setFrozen(undefined);
      animation.actions.setResizing(false);
    },
    update: (segment, ms, commit) => {
      if (segment.kind === 'hold')
        animation.actions.setHoldMs(segment.stepId, ms, {commit});
      else animation.actions.setTransition(segment.stepId, {ms}, {commit});
    },
  });
  const ticks = createMemo(() => {
    const count = Math.max(1, width() / 64);
    const step =
      [500, 1000, 2000, 5000, 10000, 30000, 60000, 120000, 300000].find(
        ms => axis() / ms <= count,
      ) ?? axis();
    return Array.from(
      {length: Math.floor(axis() / step) + 1},
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
    <div class={styles.root}>
      <div
        class={styles.axis}
        ref={timeAxis}
        style={{'min-width': `${minimumWidth()}px`}}
      >
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
                data-first={ms === 0 ? '' : undefined}
                data-last={ms === ticks().at(-1) ? '' : undefined}
                style={assignInlineVars({
                  [styles.position]: `${(ms / axis()) * 100}%`,
                })}
              >
                {formatSeconds(ms, locale())}
              </span>
            )}
          </For>
          <span
            class={styles.playhead}
            style={assignInlineVars({
              [styles.position]: `${(animation.playhead() / axis()) * 100}%`,
            })}
          />
        </div>
        <div
          class={styles.track}
          ref={track}
          data-animation-track
          data-axis-ms={axis()}
          style={assignInlineVars({
            [styles.gaps]: `${Math.max(0, keys().length - 1) * 3}px`,
          })}
        >
          <For each={keys()}>
            {key => (
              <Show
                when={animation
                  .segments()
                  .find(segment => `${segment.kind}:${segment.stepId}` === key)}
              >
                {segment => (
                  <Segment
                    segment={segment()}
                    total={axis()}
                    resize={resize}
                    tabStop={key === tabStop()}
                    navigate={navigate}
                  />
                )}
              </Show>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
