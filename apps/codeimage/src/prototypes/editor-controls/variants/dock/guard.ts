import type {Accessor} from 'solid-js';
import {createSignal, onCleanup, onMount} from 'solid-js';

const POPOVER = '[data-popper-positioner]';
const GAP = 8;
/** The frame keeps at least this much height, however tall the popover is. */
const MIN_ROOM = 160;

/**
 * The kit's selects and the production pickers open popovers, and from a dock
 * at the bottom of the window a popover rises over the canvas. This measures
 * the open popovers and returns the height they take from the bottom of the
 * canvas, so that the canvas can end above them and the frame zooms to fit
 * there. No control then covers the frame it changes.
 */
export function createFrameGuard(
  canvas: () => HTMLElement | undefined,
): Accessor<number> {
  const [inset, setInset] = createSignal(0);
  let frame = 0;

  const measure = () => {
    frame = 0;
    const popovers = document.querySelectorAll<HTMLElement>(POPOVER);
    const area = canvas()?.getBoundingClientRect();
    const fit = canvas()?.querySelector<HTMLElement>('[data-fit-scale]');
    if (popovers.length === 0 || !area || !fit) {
      setInset(0);
      return;
    }

    // The widest the frame gets is its size at scale 1, centred. Testing
    // against that keeps the answer the same after the frame has shrunk.
    const scale = Number(fit.dataset.fitScale) || 1;
    const half = fit.getBoundingClientRect().width / scale / 2 + GAP;
    const centre = area.left + area.width / 2;
    const middle = area.top + area.height / 2;

    let top = area.bottom;
    for (const popover of popovers) {
      const rect = popover.getBoundingClientRect();
      const besideFrame =
        rect.right < centre - half || rect.left > centre + half;
      // A menu that hangs from the header is not a control of the frame.
      const fromAbove = rect.top + rect.height / 2 < middle;
      if (rect.height === 0 || besideFrame || fromAbove) continue;
      top = Math.min(top, rect.top - GAP);
    }
    setInset(
      Math.round(
        Math.max(0, Math.min(area.bottom - top, area.height - MIN_ROOM)),
      ),
    );
    // Popovers move when their content loads or the window scrolls.
    frame = requestAnimationFrame(measure);
  };

  onMount(() => {
    const observer = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(measure);
    });
    // Kobalte portals its popovers to the end of the body.
    observer.observe(document.body, {childList: true});
    onCleanup(() => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    });
  });

  return inset;
}
