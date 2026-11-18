import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createMemo,
  createSignal,
  For,
  onSettled,
  Show,
  untrack,
} from 'solid-js';
import {timelineGeometry} from './timelineGeometry';
import type {AppLocaleEntries} from '../../i18n';
import {formatSeconds} from './format';
import {createMinimap} from './timeline/minimap';
import type {TimelineModel} from './timeline/model';
import * as styles from './StripTimeline.css';

const PLAYHEAD_GRAB = 8;
const DRAG_SLOP = 4;
export function StripTimeline(props: {model: TimelineModel}) {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  let ruler!: HTMLDivElement;
  let scroller!: HTMLDivElement;
  const [width, setWidth] = createSignal(0);
  const measure = () => setWidth(scroller.clientWidth - 8);
  onSettled(() => {
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  });
  const axis = animation.durationMs;
  const geometry = createMemo(() =>
    timelineGeometry(animation.segments(), width(), {
      labels: false,
      minWidth: 8,
      between: segment =>
        segment.kind === 'transition' &&
        (props.model.stepOf(segment.stepId)?.sub ?? 1) <= 1,
    }),
  );
  const minimap = untrack(() => createMinimap(props.model, geometry));
  const at = (event: PointerEvent) => {
    const box = ruler.getBoundingClientRect();
    return geometry().xToTime(event.clientX - box.left);
  };
  const xOf = (event: PointerEvent) =>
    event.clientX - ruler.getBoundingClientRect().left;
  const grabsWindow = (x: number) => {
    const view = minimap?.view();
    return (
      !!view &&
      x >= view.x &&
      x <= view.x + view.width &&
      Math.abs(x - geometry().timeToX(animation.playhead())) > PLAYHEAD_GRAB
    );
  };
  let pan: {
    startX: number;
    moved: boolean;
    move?: (dx: number) => void;
  } | null = null;
  const [overWindow, setOverWindow] = createSignal(false);
  const pointerDown = (event: PointerEvent) => {
    event.preventDefault();
    ruler.focus();
    ruler.setPointerCapture(event.pointerId);
    if (grabsWindow(xOf(event))) {
      pan = {startX: event.clientX, moved: false, move: minimap?.pan()};
      return;
    }
    animation.actions.scrub(at(event));
  };
  const hover = (event: PointerEvent) => {
    if (!props.model || event.pointerType !== 'mouse') return;
    const x = xOf(event);
    setOverWindow(grabsWindow(x));
    const entry = geometry().entries.find(
      entry => x < entry.x + entry.width + geometry().gap,
    );
    props.model.setHover(
      entry ? {stepId: entry.segment.stepId, from: 'strip'} : null,
    );
  };
  const pointerLeave = () => {
    setOverWindow(false);
    if (props.model?.hover()?.from === 'strip') props.model.setHover(null);
  };
  const pointerMove = (event: PointerEvent) => {
    if (!ruler.hasPointerCapture(event.pointerId)) return hover(event);
    if (pan) {
      const dx = event.clientX - pan.startX;
      if (!pan.moved && Math.abs(dx) < DRAG_SLOP) return;
      pan.moved = true;
      pan.move?.(dx);
      return;
    }
    animation.actions.scrub(at(event));
  };
  const pointerUp = (event: PointerEvent) => {
    if (!ruler.hasPointerCapture(event.pointerId)) return;
    const panned = pan?.moved;
    pan = null;
    ruler.releasePointerCapture(event.pointerId);
    if (panned) return;
    animation.actions.seek(at(event));
    {
      const x = xOf(event);
      const entry =
        geometry().entries.find(entry => x < entry.x + entry.width) ??
        geometry().entries.at(-1);
      if (entry)
        animation.actions.select({stepId: entry.segment.stepId, kind: 'hold'});
    }
  };
  const ticks = createMemo(() => {
    const duration = animation.durationMs();
    const pxPerSecond = geometry().timeToX(1000) - geometry().timeToX(0);
    if (duration <= 0 || pxPerSecond <= 0) return [];
    const step =
      [250, 500, 1000, 2000, 5000, 10000, 30000].find(
        ms => (ms / 1000) * pxPerSecond >= 56,
      ) ?? 60000;
    const format = new Intl.NumberFormat(locale(), {maximumFractionDigits: 2});
    const out: {x: number; label: string | null}[] = [];
    for (let ms = 0; ms <= duration + 1; ms += step / 2) {
      const major = Math.round(ms / (step / 2)) % 2 === 0;
      out.push({
        x: geometry().timeToX(ms),
        label: major ? `${format.format(ms / 1000)} s` : null,
      });
    }
    return out;
  });
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
      data-overview
      style={{visibility: width() > 0 ? undefined : 'hidden'}}
    >
      <div class={styles.axis} style={{width: `${geometry().width}px`}}>
        <div
          ref={ruler}
          class={styles.ruler}
          role="slider"
          tabindex={0}
          aria-label={t('animation.playhead')}
          aria-valuemin={0}
          aria-valuemax={animation.durationMs()}
          aria-valuenow={Math.round(animation.playhead())}
          aria-valuetext={formatSeconds(animation.playhead(), locale())}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          onPointerLeave={pointerLeave}
          onKeyDown={keyDown}
          data-over-window={overWindow() ? '' : undefined}
        >
          <Show when={minimap?.view()}>
            {view => (
              <span
                class={styles.viewWindow}
                data-minimap-window
                aria-hidden="true"
                style={{
                  width: `${view().width}px`,
                  transform: `translateX(${view().x}px)`,
                }}
              />
            )}
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
          data-animation-track
          data-axis-ms={axis()}
          style={{gap: `${geometry().gap}px`}}
        >
          <For each={geometry().entries}>
            {entry => (
              <span
                class={styles.segment}
                data-overview-segment
                data-kind={entry.segment.kind}
                data-step-id={entry.segment.stepId}
                data-linked={
                  props.model?.linked(entry.segment.stepId) ? '' : undefined
                }
                style={{
                  ...assignInlineVars({
                    [styles.segmentWidth]: `${entry.width}px`,
                  }),
                  'margin-inline': entry.spaced
                    ? `${entry.spaced}px`
                    : undefined,
                }}
              />
            )}
          </For>
        </div>
        <Show when={ticks().length}>
          <div class={styles.ticks} aria-hidden="true" data-animation-ticks>
            <For each={ticks()}>
              {tick => (
                <span
                  class={styles.tick}
                  data-major={tick.label ? '' : undefined}
                  style={{transform: `translateX(${tick.x}px)`}}
                >
                  <Show when={tick.label}>
                    <span class={styles.tickLabel}>{tick.label}</span>
                  </Show>
                </span>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
