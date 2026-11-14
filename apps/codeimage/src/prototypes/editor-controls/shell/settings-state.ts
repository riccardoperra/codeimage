import {createSignal} from 'solid-js';

/** The sections of the settings, in the order of the navigation. */
export const SECTIONS = [
  {id: 'general', name: 'General'},
  {id: 'appearance', name: 'Appearance'},
  {id: 'experiments', name: 'Experiments'},
  {id: 'about', name: 'About'},
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

const [isOpen, setOpen] = createSignal(false);
const [section, setSection] = createSignal<SectionId>('general');
let opener: HTMLElement | undefined;

/** The Settings button of the header on screen, which a change of layout replaces. */
const headerButton = () =>
  document.querySelector<HTMLElement>('[data-settings-trigger]');

/** The settings dialog of the page. The editor shell mounts it once; anything can open it. */
export const settings = {
  isOpen,
  /** The section on screen, which stays the same from one opening to the next. */
  section,
  setSection,
  /** Opens the dialog, on a section when one is given. */
  open: (target?: unknown) => {
    const active = document.activeElement;
    opener = active instanceof HTMLElement ? active : undefined;
    // A click handler passes its event here, which is not a section.
    const found = SECTIONS.find(entry => entry.id === target);
    if (found) setSection(found.id);
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
