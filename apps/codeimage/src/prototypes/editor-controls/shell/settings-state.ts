import {createSignal} from 'solid-js';

const [isOpen, setOpen] = createSignal(false);
let opener: HTMLElement | undefined;

/** The Settings button of the header on screen, which a change of layout replaces. */
const headerButton = () =>
  document.querySelector<HTMLElement>('[data-settings-trigger]');

/** The settings dialog of the page. The editor shell mounts it once; anything can open it. */
export const settings = {
  isOpen,
  open: () => {
    const active = document.activeElement;
    opener = active instanceof HTMLElement ? active : undefined;
    setOpen(true);
  },
  /** Closes the dialog and gives focus back, which the kit's dialog does not do without a trigger. */
  close: () => {
    if (!isOpen()) return;
    setOpen(false);
    const target = opener?.isConnected ? opener : headerButton();
    queueMicrotask(() => target?.focus());
  },
};
