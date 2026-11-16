import {getEditorStore} from '@codeimage/store/editor';
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  type Accessor,
} from 'solid-js';
import type {TimelineGeometry} from '../timelineGeometry';
import type {ListViewport, TimelineModel} from './model';

type Knot = {list: number; strip: number};

const span = (axis: ListViewport['axis'], rect: DOMRect) =>
  axis === 'x' ? [rect.left, rect.width] : [rect.top, rect.height];

const scrollOf = ({element, axis}: ListViewport) =>
  axis === 'x' ? element.scrollLeft : element.scrollTop;

const sizeOf = ({element, axis}: ListViewport) =>
  axis === 'x' ? element.clientWidth : element.clientHeight;

const scrollTo = ({element, axis}: ListViewport, value: number) =>
  element.scrollTo({
    [axis === 'x' ? 'left' : 'top']: value,
    behavior: 'instant',
  });

function placeOf(viewport: ListViewport, item: Element) {
  const [origin] = span(
    viewport.axis,
    viewport.element.getBoundingClientRect(),
  );
  const [start, size] = span(viewport.axis, item.getBoundingClientRect());
  return {start: start - origin + scrollOf(viewport), size};
}

function knotsOf(viewport: ListViewport, geometry: TimelineGeometry): Knot[] {
  const entries = new Map(
    geometry.entries.map(entry => [
      `${entry.segment.kind}:${entry.segment.stepId}`,
      entry,
    ]),
  );
  const knots: Knot[] = [];
  const items = viewport.element.querySelectorAll<HTMLElement>(
    '[data-animation-segment][data-step-id]',
  );
  for (const item of items) {
    const entry = entries.get(`${item.dataset.kind}:${item.dataset.stepId}`);
    if (!entry) continue;
    const {start, size} = placeOf(viewport, item);
    const last = knots.at(-1);
    if (last && (start < last.list || entry.x < last.strip)) continue;
    knots.push(
      {list: start, strip: entry.x},
      {list: start + size, strip: entry.x + entry.width},
    );
  }
  return knots;
}

function interpolate(
  knots: Knot[],
  from: keyof Knot,
  to: keyof Knot,
  value: number,
) {
  if (!knots.length) return 0;
  if (value <= knots[0][from]) return knots[0][to];
  for (let index = 1; index < knots.length; index++) {
    const a = knots[index - 1];
    const b = knots[index];
    if (value > b[from]) continue;
    const length = b[from] - a[from];
    return length > 0
      ? a[to] + ((value - a[from]) / length) * (b[to] - a[to])
      : b[to];
  }
  const last = knots.at(-1);
  return last ? last[to] : 0;
}

const finePointer = (event: PointerEvent) =>
  event.pointerType === 'mouse' &&
  matchMedia('(hover: hover) and (pointer: fine)').matches;

export function createListViewport(
  model: TimelineModel,
  root: () => HTMLElement | undefined,
  axis: ListViewport['axis'],
) {
  const {animation} = getEditorStore();
  let expected: number | null = null;
  onMount(() => {
    const element = root();
    if (!element) return;
    const viewport = {element, axis};
    model.setViewport(viewport);
    const scrolled = () => {
      if (expected === null || Math.abs(scrollOf(viewport) - expected) > 1)
        model.markUserScroll();
      expected = null;
    };
    const over = (event: PointerEvent) => {
      if (!finePointer(event)) return;
      const stepId = (event.target as Element).closest<HTMLElement>(
        '[data-step-id]',
      )?.dataset.stepId;
      model.setHover(stepId ? {stepId, from: 'list'} : null);
    };
    const leave = () => {
      if (model.hover()?.from === 'list') model.setHover(null);
    };
    element.addEventListener('scroll', scrolled, {passive: true});
    element.addEventListener('wheel', model.markUserScroll, {passive: true});
    element.addEventListener('touchmove', model.markUserScroll, {
      passive: true,
    });
    element.addEventListener('pointerover', over);
    element.addEventListener('pointerleave', leave);
    onCleanup(() => {
      element.removeEventListener('scroll', scrolled);
      element.removeEventListener('wheel', model.markUserScroll);
      element.removeEventListener('touchmove', model.markUserScroll);
      element.removeEventListener('pointerover', over);
      element.removeEventListener('pointerleave', leave);
      leave();
      if (model.viewport() === viewport) model.setViewport(undefined);
    });
  });
  const current = createMemo(
    () =>
      model
        .steps()
        .find(
          step =>
            model.isCurrent(step.hold) || model.isCurrent(step.transition),
        )?.stepId,
  );
  const following = createMemo(() => {
    const state = animation.playback().state;
    return state === 'playing' || state === 'scrubbing';
  });
  createEffect(
    on([current, following], ([stepId, follow]) => {
      const viewport = model.viewport();
      if (!stepId || !viewport || (follow && model.followPaused())) return;
      const item = viewport.element.querySelector(
        `[data-flip="step:${CSS.escape(stepId)}"]`,
      );
      if (!item) return;
      const {start, size} = placeOf(viewport, item);
      const scroll = scrollOf(viewport);
      const visible = sizeOf(viewport);
      let target = scroll;
      if (follow) target = start + size / 2 - visible / 2;
      else if (start < scroll) target = start;
      else if (start + size > scroll + visible) target = start + size - visible;
      const max =
        (axis === 'x'
          ? viewport.element.scrollWidth
          : viewport.element.scrollHeight) - visible;
      const next = Math.max(0, Math.min(max, target));
      if (Math.abs(next - scroll) < 1) return;
      expected = next;
      scrollTo(viewport, next);
    }),
  );
}

export function createMinimap(
  model: TimelineModel,
  geometry: Accessor<TimelineGeometry>,
) {
  const [view, setView] = createSignal<{x: number; width: number} | null>(null);
  let knots: Knot[] = [];
  let frame = 0;
  const measure = () => {
    frame = 0;
    const viewport = model.viewport();
    knots = viewport ? knotsOf(viewport, geometry()) : [];
    if (!viewport || !knots.length) return setView(null);
    const start = scrollOf(viewport);
    const x = interpolate(knots, 'list', 'strip', start);
    const end = interpolate(knots, 'list', 'strip', start + sizeOf(viewport));
    const whole = x <= 0.5 && end >= geometry().width - 0.5;
    setView(whole ? null : {x, width: Math.max(4, end - x)});
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(measure);
  };
  createEffect(on(geometry, schedule));
  createEffect(() => {
    const viewport = model.viewport();
    schedule();
    if (!viewport) return;
    const {element} = viewport;
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    const settle = new MutationObserver(() => setTimeout(schedule, 320));
    settle.observe(element, {childList: true, subtree: true});
    element.addEventListener('scroll', schedule, {passive: true});
    onCleanup(() => {
      observer.disconnect();
      settle.disconnect();
      element.removeEventListener('scroll', schedule);
    });
  });
  onCleanup(() => cancelAnimationFrame(frame));
  return {
    view,

    pan: () => {
      const viewport = model.viewport();
      const from = view();
      if (!viewport || !from) return undefined;
      return (dx: number) => {
        model.markUserScroll();
        scrollTo(viewport, interpolate(knots, 'strip', 'list', from.x + dx));
      };
    },
  };
}
