import {createSignal} from 'solid-js';

const isApple = /Mac|iPhone|iPad/.test(navigator.platform);

const [isOpen, setOpen] = createSignal(false);
let opener: HTMLElement | undefined;

// Run before the menu opens, so that a layout can close what it has open.
const makeWay = new Set<() => void>();
// Run as the menu closes, while the event that closed it is still running.
const closing = new Set<() => void>();

// A list, a menu or a popover that is open, or a modal dialog. Each keeps
// focus to itself, so a menu opened over one would fight it for focus.
const OPEN_POPUP =
  '[aria-haspopup]:not([aria-haspopup="false"])[aria-expanded="true"], [role="alertdialog"], [data-control-overlay]';

/**
 * One command menu for the page. The harness mounts it once for every layout
 * and binds the shortcut. A layout imports this to add a button that opens it.
 */
export const commandMenu = {
  isOpen,
  /** The shortcut as the platform writes it, for a hint beside a button. */
  shortcut: isApple ? '⌘K' : 'Ctrl K',
  isShortcut: (event: KeyboardEvent) =>
    (isApple ? event.metaKey : event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.key.toLowerCase() === 'k',
  /** Opens the menu, unless something else is open that the layout did not close. */
  open: () => {
    if (isOpen()) return;
    makeWay.forEach(close => close());
    if (document.querySelector(OPEN_POPUP)) return;
    const active = document.activeElement;
    opener = active instanceof HTMLElement ? active : undefined;
    setOpen(true);
  },
  close: () => {
    if (!isOpen()) return;
    closing.forEach(handler => handler());
    setOpen(false);
  },
  /** Registers work for the moment the menu closes. Returns the undo. */
  onClose: (handler: () => void) => {
    closing.add(handler);
    return () => closing.delete(handler);
  },
  /** What had focus when the menu opened, to give it back. */
  opener: () => opener,
  /** Registers what a layout closes to make way for the menu. Returns the undo. */
  beforeOpen: (close: () => void) => {
    makeWay.add(close);
    return () => makeWay.delete(close);
  },
};
