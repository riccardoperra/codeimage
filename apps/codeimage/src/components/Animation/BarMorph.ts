import {curve, reduced, timelineFor} from './timeline/motion';

export type Box = {left: number; top: number; right: number; bottom: number};

export const boxOf = (rect: DOMRect): Box => ({
  left: rect.left,
  top: rect.top,
  right: rect.right,
  bottom: rect.bottom,
});
function visibleBox(surface: HTMLElement): Box {
  const box = boxOf(surface.getBoundingClientRect());
  const match = /^inset\(([^)]*)\)/.exec(getComputedStyle(surface).clipPath);
  if (!match) return box;
  const [top, right = top, bottom = top, left = right] = match[1]
    .split(' round ')[0]
    .trim()
    .split(/\s+/)
    .map(parseFloat);
  return {
    left: box.left + left,
    top: box.top + top,
    right: box.right - right,
    bottom: box.bottom - bottom,
  };
}

const opacityOf = (element: Element) =>
  parseFloat(getComputedStyle(element).opacity);

const inset = (outer: Box, inner: Box, radius: string) =>
  `inset(${inner.top - outer.top}px ${outer.right - inner.right}px ${
    outer.bottom - inner.bottom
  }px ${inner.left - outer.left}px round ${radius})`;

function stop(...elements: HTMLElement[]) {
  for (const element of elements)
    for (const animation of element.getAnimations({subtree: true}))
      animation.cancel();
}

export function reshapeSurface(options: {
  bar: HTMLElement;
  surface: HTMLElement;
  old: Box;
  duration: number;
}) {
  const {bar, surface, old} = options;
  for (const animation of surface.getAnimations()) animation.cancel();
  surface.removeAttribute('style');
  const now = boxOf(bar.getBoundingClientRect());
  const radius = getComputedStyle(bar).borderTopLeftRadius;
  const union: Box = {
    left: Math.min(old.left, now.left),
    top: Math.min(old.top, now.top),
    right: Math.max(old.right, now.right),
    bottom: Math.max(old.bottom, now.bottom),
  };
  Object.assign(surface.style, {
    left: `${union.left - now.left}px`,
    top: `${union.top - now.top}px`,
    right: `${now.right - union.right}px`,
    bottom: `${now.bottom - union.bottom}px`,
  });
  surface
    .animate(
      [
        {clipPath: inset(union, old, radius)},
        {clipPath: inset(union, now, radius)},
      ],
      {duration: options.duration, easing: curve.out, fill: 'forwards'},
    )
    .finished.then(animation => {
      surface.removeAttribute('style');
      animation.cancel();
    })
    .catch(() => undefined);
}

export function morphBar(options: {
  bar: HTMLElement;
  surface: HTMLElement;
  anchor: HTMLElement;
  from: HTMLElement[];
  to: HTMLElement[];
  opening: boolean;
  animate: boolean;
  change: () => void;
  done?: () => void;
}) {
  const {bar, surface, from, to, opening} = options;
  for (const group of to) group.removeAttribute('style');
  if (!options.animate) {
    stop(surface, ...from, ...to);
    surface.removeAttribute('style');
    options.change();
    queueMicrotask(() => options.done?.());
    return;
  }
  const reduce = reduced();
  const old = visibleBox(surface);
  const leaving = from.map(group => ({
    group,
    box: group.getBoundingClientRect(),
    opacity: opacityOf(group),
  }));
  const arriving = to.flatMap(group => {
    const groupOpacity = opacityOf(group);
    return ([...group.children] as HTMLElement[]).map(item => ({
      item,
      opacity: opacityOf(item) * groupOpacity,
      midway: groupOpacity > 0.01,
    }));
  });
  for (const group of from)
    for (const animation of group.getAnimations()) animation.cancel();
  stop(surface, ...to);
  surface.removeAttribute('style');
  options.change();
  queueMicrotask(() => {
    settle();
    options.done?.();
  });

  function settle() {
    const now = boxOf(bar.getBoundingClientRect());
    if (!reduce)
      reshapeSurface({
        bar,
        surface,
        old,
        duration: opening ? timelineFor.barOpen : timelineFor.barClose,
      });

    for (const {group, box, opacity} of leaving) {
      Object.assign(group.style, {
        left: `${box.left - now.left}px`,
        top: `${box.top - now.top}px`,
        width: `${box.width}px`,
      });
      group.animate(
        [
          {opacity, visibility: 'visible', translate: '0 0'},
          {
            opacity: 0,
            visibility: 'visible',
            translate: reduce ? '0 0' : `0 ${opening ? -3 : 3}px`,
          },
        ],
        {
          duration: opening ? timelineFor.barOut : timelineFor.barOutClose,
          easing: curve.out,
        },
      );
    }

    const anchor = options.anchor.getBoundingClientRect();
    const center = anchor.left + anchor.width / 2;
    const distance = (item: HTMLElement) => {
      const box = item.getBoundingClientRect();
      return Math.abs(box.left + box.width / 2 - center);
    };
    arriving
      .map(entry => ({...entry, distance: distance(entry.item)}))
      .sort((a, b) => a.distance - b.distance)
      .forEach(({item, opacity, midway}, index) => {
        const start = midway ? 0 : barArrivalDelay(opening);
        const stagger =
          opening && !reduce && !midway ? timelineFor.barStagger : 0;
        item.animate(
          [
            {
              opacity,
              translate: reduce ? '0 0' : `0 ${opening ? 4 : -4}px`,
            },
            {opacity: 1, translate: '0 0'},
          ],
          {
            duration: opening ? timelineFor.barIn : timelineFor.barInClose,
            delay: start + index * stagger,
            easing: curve.out,
            fill: 'backwards',
          },
        );
      });
  }
}

function barArrivalDelay(opening: boolean) {
  return opening ? timelineFor.barInAt : timelineFor.barInAtClose;
}
