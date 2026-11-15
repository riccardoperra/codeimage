import {onCleanup, onMount} from 'solid-js';

// The pickers' popovers and the kit selects' lists.
const OPEN_TRIGGER = [
  '[aria-haspopup="dialog"][aria-expanded="true"][aria-controls]',
  '[aria-haspopup="listbox"][aria-expanded="true"][aria-controls]',
].join(', ');
/**
 * The choices of the production aspect ratio picker are divs with a click
 * handler only. These are their development class names.
 */
const CHOICES =
  '[class*="_aspectRatioCard__"], [class*="_aspectRatioCardFull__"]';

/** Lets the keyboard reach a div that only listens for clicks. */
function reachable(element: HTMLElement) {
  if ('keys' in element.dataset) return;
  element.dataset.keys = '';
  element.tabIndex = 0;
  element.setAttribute('role', 'button');
  element.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    element.click();
  });
}
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * The production pickers open a SidebarPopover at the right end of their
 * trigger, made for a sidebar on the left. Inspector's panel is on the right,
 * so the popover would land on the canvas, and a select's list flips up over
 * it near the bottom of a phone sheet. This moves each overlay opened from
 * the panel inside the panel, its collision boundary. Tall content scrolls
 * inside that boundary while the canvas keeps its size.
 */
export function createOverlayPlacement(
  panel: () => HTMLElement | undefined,
  canvas: () => HTMLElement | undefined,
): void {
  let frame = 0;
  // Places a popover in the same task that the popover moved it, before a
  // paint could show it where it started.
  const moved = new MutationObserver(() => measure());
  const watched = new WeakSet<HTMLElement>();

  const tick = () => {
    frame = 0;
    measure();
  };

  const measure = () => {
    const host = panel();
    const box = host?.getBoundingClientRect();
    const area = canvas()?.getBoundingClientRect();
    const triggers = host
      ? [...host.querySelectorAll<HTMLElement>(OPEN_TRIGGER)]
      : [];
    for (const trigger of triggers) {
      const content = document.getElementById(
        trigger.getAttribute('aria-controls') ?? '',
      );
      const positioner = content?.closest<HTMLElement>(
        '[data-popper-positioner]',
      );
      if (!content || !positioner || !box || !area || box.height === 0)
        continue;
      for (const choice of content.querySelectorAll<HTMLElement>(CHOICES)) {
        reachable(choice);
        choice.setAttribute(
          'aria-pressed',
          String(
            choice.hasAttribute('data-selected') ||
              choice.className.includes('_selected_true'),
          ),
        );
      }
      if (!watched.has(positioner)) {
        watched.add(positioner);
        moved.observe(positioner, {
          attributes: true,
          attributeFilter: ['style'],
        });
      }
      // Where the popover placed it, without this function's own shift.
      const shiftX = Number(positioner.dataset.shiftX ?? 0);
      const shiftY = Number(positioner.dataset.shiftY ?? 0);
      const rect = positioner.getBoundingClientRect();
      const left = rect.left - shiftX;
      const top = rect.top - shiftY;
      // With data-inspector-side="left" the panel sits before the canvas.
      const panelFirst = box.right <= area.left + 1;
      const x =
        rect.width <= box.width
          ? clamp(left, box.left, box.right - rect.width)
          : panelFirst
            ? box.left
            : box.right - rect.width;
      let y: number;
      let cap = box.height;
      if (trigger.getAttribute('aria-haspopup') === 'listbox') {
        // A select opens on pointer down, so a list over its trigger would
        // take the rest of the same press. It stays above or below it.
        const anchor = trigger.getBoundingClientRect();
        const below = box.bottom - anchor.bottom - 4;
        const above = anchor.top - box.top - 4;
        const fits = top >= box.top - 1 && top + rect.height <= box.bottom + 1;
        cap = fits ? Infinity : Math.max(below, above);
        const height = Math.min(rect.height, cap);
        y = fits
          ? top
          : below >= above
            ? anchor.bottom + 4
            : anchor.top - 4 - height;
      } else {
        y =
          rect.height <= box.height
            ? clamp(top, box.top, box.bottom - rect.height)
            : box.top;
      }
      // Taller than its room, it scrolls inside a box that fits.
      const maxHeight = cap === Infinity ? '' : `${Math.floor(cap)}px`;
      if (content.style.maxHeight !== maxHeight) {
        content.style.maxHeight = maxHeight;
        content.style.overflowY = maxHeight ? 'auto' : '';
      }
      const dx = Math.round(x - left);
      const dy = Math.round(y - top);
      if (dx !== shiftX || dy !== shiftY) {
        positioner.dataset.shiftX = String(dx);
        positioner.dataset.shiftY = String(dy);
        positioner.style.translate = `${dx}px ${dy}px`;
      }
    }
    // Popovers move and resize while their content loads.
    if (triggers.length && !frame) frame = requestAnimationFrame(tick);
  };

  onMount(() => {
    // The production pickers open from a div with role button, which takes
    // focus but, unlike a button, does not click on Enter or Space.
    const reachTriggers = () => {
      for (const trigger of panel()?.querySelectorAll<HTMLElement>(
        'div[aria-haspopup="dialog"]',
      ) ?? [])
        reachable(trigger);
    };
    const triggers = new MutationObserver(reachTriggers);
    const root = panel();
    if (root) triggers.observe(root, {childList: true, subtree: true});
    reachTriggers();
    onCleanup(() => triggers.disconnect());
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const observer = new MutationObserver(() => {
      measure();
      schedule();
    });
    const host = panel();
    if (host)
      observer.observe(host, {
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-expanded'],
      });
    // Kobalte portals its popovers to the end of the body.
    observer.observe(document.body, {childList: true});
    onCleanup(() => {
      observer.disconnect();
      moved.disconnect();
      cancelAnimationFrame(frame);
    });
  });
}
