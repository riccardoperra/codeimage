import type {EasingCurve} from '@core/animation/model';
import {createSignal, For, Index, Show} from 'solid-js';
import type {AnimateStore, Segment} from './store';
import {curveOfStep, formatMs} from './store';
import * as styles from './timeline.css';

export type TimelineLayout = 'strip' | 'rails' | 'blocks';

type Drag = {key: string; atMs: number; leftPercent: number};

export function CurveGlyph(props: {curve: EasingCurve; class?: string}) {
  const d = () => {
    const [x1, y1, x2, y2] = props.curve;
    return `M0 12 C${x1 * 16} ${12 - y1 * 12} ${x2 * 16} ${12 - y2 * 12} 16 0`;
  };
  return (
    <svg
      class={`${styles.curveGlyph} ${props.class ?? ''}`}
      viewBox="0 0 16 12"
      aria-hidden="true"
    >
      <path d={d()} />
    </svg>
  );
}

/**
 * The proportional track. Each hold and transition is as wide as it lasts.
 * Dragging a segment's right edge resizes it and the later ones ripple; the
 * scale holds still until the pointer is released. Only the ruler scrubs.
 */
export function Timeline(props: {store: AnimateStore; layout: TimelineLayout}) {
  const store = props.store;
  let tracks!: HTMLDivElement;
  const [frozenTotal, setFrozenTotal] = createSignal<number | null>(null);
  const [drag, setDrag] = createSignal<Drag | null>(null);
  const total = () => Math.max(1, frozenTotal() ?? store.durationMs());
  const percent = (ms: number) => (100 * ms) / total();

  const ticks = () => {
    const every = total() > 4500 ? 1000 : 500;
    return Array.from(
      {length: Math.floor(total() / every) + 1},
      (_, index) => index * every,
    );
  };

  const stepOf = (segment: Segment) =>
    store.steps().find(step => step.id === segment.stepId)!;
  const isSelected = (segment: Segment) => {
    const selected = store.selection();
    return (
      selected?.stepId === segment.stepId && selected.kind === segment.kind
    );
  };
  const isCurrent = (segment: Segment) =>
    store.playback().state !== 'editing' &&
    store.segmentAt(store.playhead())?.key === segment.key;

  // Scrubbing, on the ruler only.
  const timeAt = (element: HTMLElement, clientX: number) => {
    const {left, width} = element.getBoundingClientRect();
    return ((clientX - left) / width) * total();
  };
  type RulerEvent = PointerEvent & {currentTarget: HTMLElement};
  const onRulerDown = (event: RulerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    store.actions.scrub(timeAt(event.currentTarget, event.clientX));
  };
  const onRulerMove = (event: RulerEvent) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    store.actions.scrub(timeAt(event.currentTarget, event.clientX));
  };
  const onRulerUp = (event: RulerEvent) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    store.actions.seek(timeAt(event.currentTarget, event.clientX));
  };

  // Resizing, from a segment's right edge. 100 ms steps, 10 ms with Alt.
  const startResize = (segment: Segment, event: PointerEvent) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    handle.dataset.dragging = '';
    const selection = {stepId: segment.stepId, kind: segment.kind};
    store.actions.select(selection);
    const frozen = store.durationMs();
    setFrozenTotal(frozen);
    store.setDragging(true);
    const pxPerMs = tracks.getBoundingClientRect().width / frozen;
    const startX = event.clientX;
    const startMs = segment.durationMs;
    const show = () => {
      const now = store.segments().find(s => s.key === segment.key);
      if (now)
        setDrag({
          key: segment.key,
          atMs: now.durationMs,
          leftPercent: percent(now.startMs + now.durationMs),
        });
    };
    show();
    const move = (moved: PointerEvent) => {
      const step = moved.altKey ? 10 : 100;
      const raw = startMs + (moved.clientX - startX) / pxPerMs;
      store.actions.setDuration(selection, Math.round(raw / step) * step);
      show();
    };
    const up = () => {
      delete handle.dataset.dragging;
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
      setDrag(null);
      setFrozenTotal(null);
      store.setDragging(false);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  };

  const onSegmentKey = (segment: Segment, event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const by = (event.altKey ? 10 : 100) * (event.key === 'ArrowLeft' ? -1 : 1);
    const selection = {stepId: segment.stepId, kind: segment.kind};
    store.actions.select(selection);
    store.actions.setDuration(selection, segment.durationMs + by);
  };

  const SegmentView = (p: {
    segment: Segment;
    style: Record<string, string>;
    inBlock?: boolean;
    last?: boolean;
  }) => {
    const step = () => stepOf(p.segment);
    const name = () => store.tabName(step().editorId);
    const label = () =>
      p.segment.kind === 'hold'
        ? `Hold of step ${p.segment.step + 1}, ${name()}`
        : `Transition from step ${p.segment.step + 1} to ${p.segment.step + 2}`;
    return (
      <div
        class={styles.segment}
        role="slider"
        tabIndex={0}
        aria-label={label()}
        aria-valuemin={0}
        aria-valuemax={10_000}
        aria-valuenow={p.segment.durationMs}
        aria-valuetext={formatMs(p.segment.durationMs)}
        data-kind={p.segment.kind}
        data-selected={isSelected(p.segment) ? '' : undefined}
        data-current={isCurrent(p.segment) ? '' : undefined}
        data-in-block={p.inBlock ? '' : undefined}
        data-last={p.last ? '' : undefined}
        style={p.style}
        title={`${label()} · ${formatMs(p.segment.durationMs)}`}
        onPointerDown={() =>
          store.actions.select({
            stepId: p.segment.stepId,
            kind: p.segment.kind,
          })
        }
        on:keydown={event => onSegmentKey(p.segment, event)}
      >
        <Show
          when={p.segment.kind === 'hold'}
          fallback={
            <>
              <CurveGlyph curve={curveOfStep(step().easing)} />
              <span class={styles.duration}>
                {formatMs(p.segment.durationMs)}
              </span>
            </>
          }
        >
          <span class={styles.stepNumber}>{p.segment.step + 1}</span>
          <span class={styles.segmentText}>{name()}</span>
          <span class={styles.duration}>{formatMs(p.segment.durationMs)}</span>
        </Show>
        <span
          class={styles.handle}
          onPointerDown={event => startResize(p.segment, event)}
        />
      </div>
    );
  };

  const place = (segment: Segment) => ({
    left: `calc(${percent(segment.startMs)}% + 1px)`,
    width: `max(4px, calc(${percent(segment.durationMs)}% - 2px))`,
  });

  const holds = () => store.segments().filter(s => s.kind === 'hold');
  const transitions = () =>
    store.segments().filter(s => s.kind === 'transition');
  const gutter = () => (props.layout === 'rails' ? '78px' : '0px');

  return (
    <div class={styles.timeline}>
      <div
        class={styles.ruler}
        style={{'margin-left': gutter()}}
        onPointerDown={onRulerDown}
        onPointerMove={onRulerMove}
        onPointerUp={onRulerUp}
        aria-label="Playhead"
        role="presentation"
      >
        <For each={ticks()}>
          {ms => (
            <span class={styles.tick} style={{left: `${percent(ms)}%`}}>
              {ms % 1000 === 0 ? `${ms / 1000}s` : ''}
            </span>
          )}
        </For>
        <div
          class={styles.playhead}
          style={{left: `${percent(store.playhead())}%`}}
        >
          <span class={styles.playheadKnob} />
        </div>
      </div>

      <div
        class={styles.tracks}
        style={{
          'margin-left': gutter(),
          'margin-top': props.layout === 'blocks' ? '16px' : '0px',
        }}
        ref={tracks}
      >
        <Show when={props.layout === 'strip'}>
          <div class={styles.lane}>
            <Index each={store.segments()}>
              {segment => (
                <SegmentView segment={segment()} style={place(segment())} />
              )}
            </Index>
          </div>
        </Show>

        <Show when={props.layout === 'rails'}>
          <div class={styles.lane} data-lane="hold">
            <span class={styles.laneLabel} style={{left: '-78px', top: '13px'}}>
              Holds
            </span>
            <Index each={holds()}>
              {segment => (
                <SegmentView segment={segment()} style={place(segment())} />
              )}
            </Index>
          </div>
          <div class={styles.lane} data-lane="transition">
            <span class={styles.laneLabel} style={{left: '-78px', top: '7px'}}>
              Transitions
            </span>
            <Index each={transitions()}>
              {segment => (
                <SegmentView segment={segment()} style={place(segment())} />
              )}
            </Index>
          </div>
        </Show>

        <Show when={props.layout === 'blocks'}>
          <div class={styles.lane} data-lane="block">
            <Index each={holds()}>
              {holdOf => {
                const hold = holdOf;
                const transition = () =>
                  transitions().find(t => t.stepId === hold().stepId);
                const blockMs = () =>
                  hold().durationMs + (transition()?.durationMs ?? 0);
                const inner = (ms: number) =>
                  `${(100 * ms) / Math.max(1, blockMs())}%`;
                return (
                  <div
                    class={styles.block}
                    style={{
                      left: `calc(${percent(hold().startMs)}% + 2px)`,
                      width: `calc(${percent(blockMs())}% - 4px)`,
                    }}
                  >
                    <span class={styles.blockLabel}>
                      Step {hold().step + 1} ·{' '}
                      {store.tabName(stepOf(hold()).editorId)}
                    </span>
                    <SegmentView
                      segment={hold()}
                      inBlock
                      last={!transition()}
                      style={{left: '0', width: inner(hold().durationMs)}}
                    />
                    <Show when={transition()}>
                      {t => (
                        <SegmentView
                          segment={t()}
                          inBlock
                          style={{
                            left: inner(hold().durationMs),
                            width: inner(t().durationMs),
                          }}
                        />
                      )}
                    </Show>
                  </div>
                );
              }}
            </Index>
          </div>
        </Show>

        <div
          class={styles.playhead}
          style={{left: `${percent(store.playhead())}%`}}
        />
        <Show when={drag()}>
          {d => (
            <span
              class={styles.dragValue}
              style={{
                left: `${d().leftPercent}%`,
                top: '-26px',
                bottom: 'auto',
              }}
            >
              {formatMs(d().atMs)}
            </span>
          )}
        </Show>
      </div>
    </div>
  );
}
