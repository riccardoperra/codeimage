import {createEffect, on, onCleanup, onMount, type Accessor} from 'solid-js';
import {curve, reduceMotion} from '../../WhatsNew/motion';

export const timelineFor = {
  enter: 200,

  exit: 150,

  settle: 200,

  makeRoom: 180,

  glide: 180,

  open: 200,

  openAfterBar: 60,

  barOpen: 220,
  barClose: 150,

  barOut: 90,
  barOutClose: 60,
  barIn: 190,
  barInClose: 110,

  barInAt: 60,
  barInAtClose: 40,
  barStagger: 30,
} as const;

export {curve};
let modality: 'pointer' | 'keyboard' = 'keyboard';
if (typeof document !== 'undefined') {
  document.documentElement.dataset.animateInput = modality;
  document.addEventListener(
    'pointerdown',
    () => {
      modality = 'pointer';
      document.documentElement.dataset.animateInput = modality;
    },
    true,
  );
  document.addEventListener(
    'keydown',
    () => {
      modality = 'keyboard';
      document.documentElement.dataset.animateInput = modality;
    },
    true,
  );
}
export const byPointer = () => modality === 'pointer';
let pointerToggle = false;
export function markPointerToggle(event: MouseEvent) {
  if (event.detail === 0) return;
  pointerToggle = true;
  setTimeout(() => {
    pointerToggle = false;
  });
}
export const toggledByPointer = () => pointerToggle;
export const reduced = () =>
  typeof matchMedia !== 'undefined' && matchMedia(reduceMotion).matches;

type Rects = Map<string, DOMRect>;
const measure = (root: ParentNode): Rects =>
  new Map(
    [...root.querySelectorAll<HTMLElement>('[data-flip]')].map(element => [
      element.dataset.flip!,
      element.getBoundingClientRect(),
    ]),
  );

function play(root: ParentNode, before: Rects, skip?: string) {
  for (const element of root.querySelectorAll<HTMLElement>('[data-flip]')) {
    const key = element.dataset.flip!;
    if (key === skip) continue;
    const previous = before.get(key);
    if (!previous) {
      element.animate(
        reduced()
          ? [{opacity: 0}, {opacity: 1}]
          : [
              {opacity: 0, scale: '0.96'},
              {opacity: 1, scale: '1'},
            ],
        {duration: timelineFor.enter, easing: curve.out},
      );
      continue;
    }
    if (reduced()) continue;
    const now = element.getBoundingClientRect();
    const dx = previous.left - now.left;
    const dy = previous.top - now.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
    element.animate([{translate: `${dx}px ${dy}px`}, {translate: '0px 0px'}], {
      duration: timelineFor.settle,
      easing: curve.out,
    });
  }
}

export function flip(root: HTMLElement | undefined, change: () => void) {
  if (!root || !byPointer()) return change();
  const before = measure(root);
  change();
  requestAnimationFrame(() => play(root, before));
}

export function exit(
  root: HTMLElement | undefined,
  element: Element | null | undefined,
  change: () => void,
) {
  if (!root || !(element instanceof HTMLElement) || !byPointer())
    return change();
  const box = root.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const ghost = element.cloneNode(true) as HTMLElement;
  ghost.removeAttribute('data-flip');
  ghost.querySelectorAll('[data-flip]').forEach(child => {
    child.removeAttribute('data-flip');
  });
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;
  Object.assign(ghost.style, {
    position: 'absolute',
    left: `${rect.left - box.left + root.scrollLeft}px`,
    top: `${rect.top - box.top + root.scrollTop}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    pointerEvents: 'none',
    zIndex: '3',
  });
  const before = measure(root);
  change();
  root.append(ghost);
  ghost
    .animate(
      reduced()
        ? [{opacity: 1}, {opacity: 0}]
        : [
            {opacity: 1, scale: '1'},
            {opacity: 0, scale: '0.96'},
          ],
      {duration: timelineFor.exit, easing: curve.out, fill: 'forwards'},
    )
    .finished.finally(() => ghost.remove());
  requestAnimationFrame(() => play(root, before));
}

export function startReorder(
  event: PointerEvent,
  options: {
    item: HTMLElement;
    root: HTMLElement;
    selector: string;
    axis: 'x' | 'y';
    ignore?: string;
    onDrop: (to: number) => void;
    onDrag?: (dragging: boolean) => void;
  },
) {
  if (event.button !== 0 || !event.isPrimary) return;
  if (options.ignore && (event.target as HTMLElement).closest(options.ignore))
    return;
  const {item, axis} = options;
  const items = [
    ...options.root.querySelectorAll<HTMLElement>(options.selector),
  ];
  const from = items.indexOf(item);
  if (from < 0 || items.length < 2) return;
  event.preventDefault();
  const pointerId = event.pointerId;
  const start = axis === 'x' ? event.clientX : event.clientY;
  const rects = items.map(element => element.getBoundingClientRect());
  const lead = (rect: DOMRect) => (axis === 'x' ? rect.left : rect.top);
  const size = (rect: DOMRect) => (axis === 'x' ? rect.width : rect.height);
  const gap =
    from < items.length - 1
      ? lead(rects[from + 1]) - lead(rects[from]) - size(rects[from])
      : lead(rects[from]) - lead(rects[from - 1]) - size(rects[from - 1]);
  const room = size(rects[from]) + gap;
  const translate = (value: number) =>
    axis === 'x' ? `translateX(${value}px)` : `translateY(${value}px)`;
  let to = from;
  let delta = 0;
  let dragging = false;
  const move = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    delta = (axis === 'x' ? event.clientX : event.clientY) - start;
    if (!dragging) {
      if (Math.abs(delta) < 5) return;
      dragging = true;
      item.setPointerCapture(pointerId);
      options.onDrag?.(true);
      for (const element of items)
        if (element !== item)
          element.style.transition = reduced()
            ? 'none'
            : `transform ${timelineFor.makeRoom}ms ${curve.out}`;
    }
    item.style.transform = translate(delta);
    const center = lead(rects[from]) + size(rects[from]) / 2 + delta;
    to = rects.filter(
      (rect, index) => index !== from && lead(rect) + size(rect) / 2 < center,
    ).length;
    items.forEach((element, index) => {
      if (element === item) return;
      const shift =
        from < to && index > from && index <= to
          ? -room
          : to < from && index >= to && index < from
            ? room
            : 0;
      element.style.transform = shift ? translate(shift) : '';
    });
  };
  const finish = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', finish);
    if (!dragging) return;
    const swallow = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
    };
    window.addEventListener('click', swallow, {capture: true, once: true});
    setTimeout(() => window.removeEventListener('click', swallow, true));
    const key = item.dataset.flip;
    const dropped = item.getBoundingClientRect();
    for (const element of items) {
      element.style.transition = '';
      element.style.transform = '';
    }
    options.onDrag?.(false);
    if (to !== from && event.type === 'pointerup') options.onDrop(to);
    requestAnimationFrame(() => {
      const target = key
        ? options.root.querySelector<HTMLElement>(
            `[data-flip="${CSS.escape(key)}"]`,
          )
        : item;
      if (!target || reduced()) return;
      const now = target.getBoundingClientRect();
      target.animate(
        [
          {
            translate: `${dropped.left - now.left}px ${dropped.top - now.top}px`,
          },
          {translate: '0px 0px'},
        ],
        {duration: timelineFor.settle, easing: curve.out},
      );
    });
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', finish);
}

export function createIndicator(options: {
  root: () => HTMLElement | undefined;
  ring: () => HTMLElement | undefined;
  target: Accessor<string | null>;
  layout: Accessor<unknown>;
}) {
  const place = (glide: boolean, retry = true, scroll = retry) => {
    const root = options.root();
    const ring = options.ring();
    if (!root || !ring) return;
    const key = options.target();
    const element = key
      ? root.querySelector<HTMLElement>(`[data-ring="${CSS.escape(key)}"]`)
      : null;
    if (!element) {
      if (key && retry) requestAnimationFrame(() => place(false, false, true));
      else ring.style.opacity = '0';
      return;
    }
    if (scroll) element.scrollIntoView({block: 'nearest', inline: 'nearest'});
    let x = 0;
    let y = 0;
    let node: HTMLElement | null = element;
    while (node && node !== ring.offsetParent) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    const wasHidden = ring.style.opacity === '0' || !ring.style.width;
    ring.toggleAttribute('data-glide', glide && !wasHidden && !reduced());
    ring.style.opacity = '1';
    ring.style.width = `${element.offsetWidth}px`;
    ring.style.height = `${element.offsetHeight}px`;
    ring.style.transform = `translate(${x}px, ${y}px)`;
  };
  createEffect(on(options.target, () => place(byPointer())));
  createEffect(
    on(options.layout, () => requestAnimationFrame(() => place(false, false)), {
      defer: true,
    }),
  );
  onMount(() => {
    const observer = new ResizeObserver(() => place(false, false));
    const root = options.root();
    if (root) observer.observe(root);
    onCleanup(() => observer.disconnect());
  });
  return {place};
}
