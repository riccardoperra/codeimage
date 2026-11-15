import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {
  DURATION_LIMITS,
  transitionOf,
  type AnimationSegment,
} from '@codeimage/store/editor/animationSettings';
import {easingOf} from '@core/animation/easing';
import {createResizeObserver} from '@solid-primitives/resize-observer';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onMount,
  Show,
} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {createSegmentResize} from '../createSegmentResize';
import {EasingCurve} from '../EasingCurve';
import {formatSeconds} from '../format';
import * as strip from '../StripTimeline.css';
import {scaledGeometry} from './geometry';
import {shortMs} from './StepList';
import {phone} from './variant';
import * as styles from './proto.css';

type Zoom = 'fit' | '1x';
const [zoom, setZoom] = createSignal<Zoom>('fit');

function label(
  segment: AnimationSegment,
  width: number,
  name: string,
): 'full' | 'number' | 'none' {
  if (segment.kind === 'transition')
    return width >= 64 ? 'full' : width >= 26 ? 'number' : 'none';
  const full = `${segment.index + 1} · ${name}`;
  return width >= full.length * 6.4 + 14
    ? 'full'
    : width >= 16
      ? 'number'
      : 'none';
}

/** E: the strip fits the width by default; 1× zooms to a fixed px/s with a minimap. */
export function FitStrip() {
  const {animation, editor} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  let scroller!: HTMLDivElement;
  let ruler!: HTMLDivElement;
  let minimap: HTMLDivElement | undefined;
  const [viewport, setViewport] = createSignal(0);
  const [scrollLeft, setScrollLeft] = createSignal(0);
  onMount(() =>
    createResizeObserver(
      () => scroller,
      () => setViewport(scroller.clientWidth),
    ),
  );
  const [frozen, setFrozen] = createSignal<number>();
  const geometry = createMemo(() => {
    const segments = animation.segments();
    const gap = zoom() === 'fit' && segments.length > 40 ? 1 : 2;
    return zoom() === 'fit'
      ? scaledGeometry(segments, {
          width: viewport(),
          scale: frozen(),
          min: 3,
          gap,
        })
      : scaledGeometry(segments, {
          scale: frozen() ?? (phone() ? 0.06 : 0.1),
          min: phone() ? 44 : 28,
          gap: 3,
        });
  });
  const mini = createMemo(() =>
    scaledGeometry(animation.segments(), {
      width: viewport(),
      min: 1,
      gap: 1,
    }),
  );
  const overflow = () => geometry().width > viewport() + 1;
  const name = (segment: AnimationSegment) =>
    editor.state.editors.find(
      tab => tab.id === animation.settings().steps[segment.index]?.editorId,
    )?.tab.tabName || t('animation.untitledTab');
  const reveal = (left: number, right = left) => {
    if (animation.resizing()) return;
    const inset = 12;
    if (left < scroller.scrollLeft + inset)
      scroller.scrollLeft = Math.max(0, left - inset);
    else if (right > scroller.scrollLeft + scroller.clientWidth - inset)
      scroller.scrollLeft = right - scroller.clientWidth + inset;
  };
  createEffect(
    on(animation.selection, selection => {
      const entry = geometry().entries.find(
        ({segment}) =>
          segment.stepId === selection?.stepId &&
          segment.kind === selection?.kind,
      );
      if (entry) reveal(entry.x, entry.x + entry.width);
    }),
  );
  createEffect(
    on(animation.playhead, ms => {
      if (animation.playback().state === 'playing')
        reveal(geometry().timeToX(ms));
    }),
  );
  const resize = createSegmentResize({
    total: animation.durationMs,
    geometry,
    limits: s =>
      s.kind === 'hold' ? DURATION_LIMITS.holdMs : DURATION_LIMITS.transitionMs,
    begin: () => {
      animation.actions.setResizing(true);
      setFrozen(geometry().scale);
    },
    end: () => {
      setFrozen(undefined);
      animation.actions.setResizing(false);
    },
    update: (s, ms, commit) => {
      if (s.kind === 'hold')
        animation.actions.setHoldMs(s.stepId, ms, {commit});
      else animation.actions.setTransition(s.stepId, {ms}, {commit});
    },
  });
  const ticks = createMemo(() => {
    const total = animation.durationMs();
    const count = Math.max(1, geometry().width / 72);
    const step =
      [500, 1000, 2000, 5000, 10000, 30000, 60000].find(
        ms => total / ms <= count,
      ) ?? total;
    return Array.from(
      {length: Math.floor(total / step) + 1},
      (_, i) => i * step,
    );
  });
  const at = (event: PointerEvent) =>
    geometry().xToTime(event.clientX - ruler.getBoundingClientRect().left);
  const rulerDown = (event: PointerEvent) => {
    event.preventDefault();
    ruler.setPointerCapture(event.pointerId);
    animation.actions.scrub(at(event));
  };
  const rulerMove = (event: PointerEvent) => {
    if (ruler.hasPointerCapture(event.pointerId))
      animation.actions.scrub(at(event));
  };
  const rulerUp = (event: PointerEvent) => {
    if (!ruler.hasPointerCapture(event.pointerId)) return;
    animation.actions.seek(at(event));
    ruler.releasePointerCapture(event.pointerId);
  };
  const jump = (event: PointerEvent) => {
    if (!minimap) return;
    const box = minimap.getBoundingClientRect();
    const ms = mini().xToTime(event.clientX - box.left);
    scroller.scrollLeft = geometry().timeToX(ms) - scroller.clientWidth / 2;
  };
  const miniDown = (event: PointerEvent) => {
    event.preventDefault();
    minimap?.setPointerCapture(event.pointerId);
    jump(event);
  };
  const miniMove = (event: PointerEvent) => {
    if (minimap?.hasPointerCapture(event.pointerId)) jump(event);
  };
  const windowBox = () => {
    const ratio = mini().width / Math.max(1, geometry().width);
    return {left: scrollLeft() * ratio, width: viewport() * ratio};
  };
  return (
    <>
      <div class={styles.fitHead}>
        <span class={styles.hint}>
          {animation.settings().steps.length} steps ·{' '}
          {formatSeconds(animation.durationMs(), locale())}
        </span>
        <SegmentedField<Zoom>
          size="xs"
          value={zoom()}
          onChange={setZoom}
          items={[
            {value: 'fit', label: 'Fit'},
            {value: '1x', label: '1×'},
          ]}
        />
      </div>
      <Show when={zoom() === '1x' && overflow()}>
        <div
          ref={minimap}
          class={styles.minimap}
          data-proto-minimap
          onPointerDown={miniDown}
          onPointerMove={miniMove}
          onPointerUp={e => minimap?.releasePointerCapture(e.pointerId)}
        >
          <For each={mini().entries}>
            {entry => (
              <span
                class={styles.minimapSegment}
                data-kind={entry.segment.kind}
                data-current={
                  animation.playback().state !== 'editing' &&
                  entry.segment.kind === 'hold' &&
                  entry.segment.index === animation.currentStep()
                    ? ''
                    : undefined
                }
                style={assignInlineVars({
                  [styles.start]: `${entry.x}px`,
                  [styles.size]: `${entry.width}px`,
                })}
              />
            )}
          </For>
          <span
            class={styles.minimapWindow}
            style={assignInlineVars({
              [styles.start]: `${windowBox().left}px`,
              [styles.size]: `${windowBox().width}px`,
            })}
          />
          <span
            class={styles.minimapPlayhead}
            style={assignInlineVars({
              [styles.position]: `${mini().timeToX(animation.playhead())}px`,
            })}
          />
        </div>
      </Show>
      <div
        ref={scroller}
        class={`${styles.fitScroller} ${zoom() === 'fit' ? styles.fitScrollerFit : ''}`}
        data-proto-fit-scroller
        onScroll={() => setScrollLeft(scroller.scrollLeft)}
      >
        <div style={{width: `${geometry().width}px`}}>
          <div
            ref={ruler}
            class={strip.ruler}
            role="slider"
            tabIndex={0}
            aria-label={t('animation.playhead')}
            aria-valuemin={0}
            aria-valuemax={animation.durationMs()}
            aria-valuenow={Math.round(animation.playhead())}
            onPointerDown={rulerDown}
            onPointerMove={rulerMove}
            onPointerUp={rulerUp}
            onPointerCancel={rulerUp}
          >
            <For each={ticks()}>
              {ms => (
                <span
                  class={strip.tick}
                  data-first={ms === 0 ? '' : undefined}
                  data-last={ms === ticks().at(-1) ? '' : undefined}
                  style={assignInlineVars({
                    [strip.position]: `${geometry().timeToX(ms)}px`,
                  })}
                >
                  {formatSeconds(ms, locale())}
                </span>
              )}
            </For>
            <span
              class={strip.playhead}
              style={assignInlineVars({
                [strip.position]: `${geometry().timeToX(animation.playhead())}px`,
              })}
            />
          </div>
          <div
            class={strip.track}
            style={{
              gap: `${zoom() === 'fit' && animation.segments().length > 40 ? 1 : 2}px`,
            }}
          >
            <For each={geometry().entries}>
              {entry => {
                const segment = () => entry.segment;
                const mode = () =>
                  label(segment(), entry.width, name(segment()));
                const selected = () =>
                  animation.selection()?.stepId === segment().stepId &&
                  animation.selection()?.kind === segment().kind;
                const current = () =>
                  animation.playback().state !== 'editing' &&
                  animation.playhead() >= segment().startMs &&
                  animation.playhead() <
                    segment().startMs + segment().durationMs;
                return (
                  <button
                    type="button"
                    class={strip.segment}
                    data-animation-segment
                    data-kind={segment().kind}
                    data-step-id={segment().stepId}
                    data-selected={selected() ? '' : undefined}
                    data-current={current() ? '' : undefined}
                    title={`${segment().kind === 'hold' ? `${segment().index + 1} · ${name(segment())}` : `→ ${segment().index + 1}`} · ${shortMs(segment().durationMs)}`}
                    style={assignInlineVars({
                      [strip.segmentWidth]: `${entry.width}px`,
                    })}
                    onClick={() =>
                      animation.actions.select({
                        stepId: segment().stepId,
                        kind: segment().kind,
                      })
                    }
                  >
                    <Show
                      when={
                        segment().kind === 'transition' && mode() !== 'none'
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
                    <Show when={mode() !== 'none'}>
                      <span class={strip.label}>
                        {segment().kind === 'hold'
                          ? mode() === 'full'
                            ? `${segment().index + 1} · ${name(segment())}`
                            : `${segment().index + 1}`
                          : mode() === 'full'
                            ? shortMs(segment().durationMs)
                            : ''}
                      </span>
                    </Show>
                    <Show when={entry.width >= (phone() ? 44 : 12)}>
                      <span
                        class={strip.handle}
                        data-segment-resize
                        aria-hidden="true"
                        onPointerDown={event => resize(event, segment())}
                      />
                    </Show>
                  </button>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </>
  );
}
