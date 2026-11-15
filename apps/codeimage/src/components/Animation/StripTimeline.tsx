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
import {timelineGeometry, type TimelineGeometry} from './timelineGeometry';
import type {AppLocaleEntries} from '../../i18n';
import {createSegmentResize} from './createSegmentResize';
import {formatDuration, formatSeconds} from './format';
import * as styles from './StripTimeline.css';
function Segment(props: {
  segment: AnimationSegment;
  geometry: TimelineGeometry['entries'][number];
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
        [styles.segmentWidth]: `${props.geometry.width}px`,
      })}
      onClick={select}
      onFocus={select}
    >
      <Show
        when={
          segment().kind === 'transition' && props.geometry.label === 'full'
        }
      >
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
      <Show when={props.geometry.label !== 'none'}>
        <span class={styles.label} data-segment-label={props.geometry.label}>
          {segment().kind === 'hold'
            ? props.geometry.label === 'full' &&
              props.geometry.width >= name().length * 6.4 + 28
              ? `${segment().index + 1} · ${name()}`
              : String(segment().index + 1)
            : formatDuration(segment().durationMs, locale())}
        </span>
      </Show>
      <span
        class={styles.handle}
        data-segment-resize
        aria-hidden="true"
        onPointerDown={resize}
      />
    </button>
  );
}
export function StripTimeline(props: {overview?: boolean}) {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  let ruler!: HTMLDivElement;
  let track!: HTMLDivElement;
  let scroller!: HTMLDivElement;
  const [width, setWidth] = createSignal(0);
  const measure = () => setWidth(scroller.clientWidth - 8);
  onMount(() => {
    measure();
    createResizeObserver(() => scroller, measure);
  });
  const axis = animation.durationMs;
  const geometry = createMemo(() =>
    timelineGeometry(animation.segments(), width(), {
      labels: !props.overview,
      minWidth: 8,
    }),
  );
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
  const resize = createSegmentResize({
    total: animation.durationMs,
    geometry,
    limits: segment =>
      segment.kind === 'hold'
        ? DURATION_LIMITS.holdMs
        : DURATION_LIMITS.transitionMs,
    begin: () => animation.actions.setResizing(true),
    end: () => {
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
    return geometry().xToTime(event.clientX - box.left);
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
    if (props.overview) {
      const x = event.clientX - ruler.getBoundingClientRect().left;
      const entry =
        geometry().entries.find(entry => x < entry.x + entry.width) ??
        geometry().entries.at(-1);
      if (entry)
        animation.actions.select({stepId: entry.segment.stepId, kind: 'hold'});
    }
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
    <div
      class={styles.root}
      ref={scroller}
      data-animation-scroller
      data-overview={props.overview ? '' : undefined}
      style={{visibility: width() > 0 ? undefined : 'hidden'}}
    >
      <div class={styles.axis} style={{width: `${geometry().width}px`}}>
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
          <Show when={!props.overview}>
            <For each={ticks()}>
              {ms => (
                <span
                  class={styles.tick}
                  data-animation-tick={ms}
                  data-first={ms === 0 ? '' : undefined}
                  data-last={ms === ticks().at(-1) ? '' : undefined}
                  style={assignInlineVars({
                    [styles.position]: `${geometry().timeToX(ms)}px`,
                  })}
                >
                  {formatSeconds(ms, locale())}
                </span>
              )}
            </For>
          </Show>
          <span
            class={styles.playhead}
            data-animation-playhead
            style={assignInlineVars({
              [styles.position]: `${geometry().timeToX(animation.playhead())}px`,
            })}
          />
        </div>
        <div
          class={styles.track}
          ref={track}
          data-animation-track
          data-axis-ms={axis()}
          style={{gap: `${geometry().gap}px`}}
        >
          <Show
            when={props.overview}
            fallback={
              <For each={keys()}>
                {key => (
                  <Show
                    when={animation
                      .segments()
                      .find(
                        segment => `${segment.kind}:${segment.stepId}` === key,
                      )}
                  >
                    {segment => (
                      <Segment
                        segment={segment()}
                        geometry={geometry().entries.find(
                          entry =>
                            `${entry.segment.kind}:${entry.segment.stepId}` ===
                            key,
                        )!}
                        resize={resize}
                        tabStop={key === tabStop()}
                        navigate={navigate}
                      />
                    )}
                  </Show>
                )}
              </For>
            }
          >
            <For each={geometry().entries}>
              {entry => (
                <span
                  class={styles.segment}
                  data-overview-segment
                  data-kind={entry.segment.kind}
                  data-step-id={entry.segment.stepId}
                  style={assignInlineVars({
                    [styles.segmentWidth]: `${entry.width}px`,
                  })}
                />
              )}
            </For>
          </Show>
        </div>
      </div>
    </div>
  );
}
