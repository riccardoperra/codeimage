/**
 * The picker switches variants on ArrowLeft, ArrowRight, digits and R from a
 * `document` listener. Solid delegates these handlers to `document` too, and
 * registers first, so only stopImmediatePropagation keeps the keys here.
 */
export function ownKeys(e: KeyboardEvent) {
  if (/^(ArrowLeft|ArrowRight|[0-9rR])$/.test(e.key)) {
    e.stopImmediatePropagation();
  }
}

const COMPOSITE =
  '[role=radiogroup], [role=tablist], [role=listbox], [aria-haspopup=listbox]';

export function handleRailPanelKey(
  event: KeyboardEvent,
  panel: HTMLElement,
  close: (returnFocus: boolean) => void,
) {
  if (!event.composedPath().includes(panel)) return;
  if (event.target instanceof Element && event.target.closest(COMPOSITE))
    ownKeys(event);
  if (event.key !== 'Escape' || event.defaultPrevented || event.cancelBubble)
    return;
  event.stopPropagation();
  close(true);
}
