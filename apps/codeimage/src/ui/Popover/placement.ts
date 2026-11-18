import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import type {Placement} from '@floating-ui/dom';

interface Options {
  placement: Placement;
  gutter: number;
  overflowPadding: number;
  getAnchorRect?: (trigger?: HTMLElement) => DOMRect | undefined;
}

function transformOrigin(placement: Placement) {
  const [side, alignment] = placement.split('-');
  const horizontal = side === 'top' || side === 'bottom';
  const align = (start: string, end: string) => {
    if (alignment === 'start') return start;
    if (alignment === 'end') return end;
    return 'center';
  };
  if (horizontal) {
    const x = align('left', 'right');
    return `${x} ${side === 'top' ? 'bottom' : 'top'}`;
  }
  const y = align('top', 'bottom');
  return `${side === 'left' ? 'right' : 'left'} ${y}`;
}

export function placePopover(
  trigger: HTMLElement,
  panel: HTMLDivElement,
  options: Options,
  ready: () => void,
) {
  const reference = options.getAnchorRect
    ? {
        contextElement: trigger,
        getBoundingClientRect: () =>
          options.getAnchorRect?.(trigger) ?? trigger.getBoundingClientRect(),
      }
    : trigger;
  let active = true;
  let sequence = 0;
  panel.style.position = 'fixed';
  panel.style.visibility = 'hidden';

  const stop = autoUpdate(reference, panel, () => {
    const next = ++sequence;
    void computePosition(reference, panel, {
      placement: options.placement,
      strategy: 'fixed',
      middleware: [
        offset(options.gutter),
        flip({padding: options.overflowPadding}),
        shift({padding: options.overflowPadding}),
      ],
    }).then(({x, y, placement}) => {
      if (!active || next !== sequence) return;
      panel.style.left = x + 'px';
      panel.style.top = y + 'px';
      panel.style.visibility = 'visible';
      panel.style.setProperty(
        '--kb-popover-content-transform-origin',
        transformOrigin(placement),
      );
      ready();
    });
  });
  return () => {
    active = false;
    stop();
  };
}
