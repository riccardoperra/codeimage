import {createSignal} from 'solid-js';

/** The sections of the settings, in the order of the navigation. */
export const SECTIONS = [
  {id: 'general', name: 'editor.general'},
  {id: 'appearance', name: 'editor.appearance'},
  {id: 'export', name: 'toolbar.export'},
  {id: 'experiments', name: 'editor.experiments'},
  {id: 'whats-new', name: 'editor.whatsNew'},
  {id: 'about', name: 'editor.about'},
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

const [isOpen, setOpen] = createSignal(false);
const [section, setSection] = createSignal<SectionId>('general');
const [query, setQuery] = createSignal('');
let opener: HTMLElement | undefined;

/** The settings entry on screen, which a change of layout replaces. */
const entryButton = () =>
  document.querySelector<HTMLElement>('[data-settings-trigger]');

/** The settings dialog of the page. The editor shell mounts it once; anything can open it. */
export const settings = {
  isOpen,
  query,
  setQuery,
  /** The section on screen, which stays the same from one opening to the next. */
  section,
  setSection,
  /** Opens the dialog, on a section when one is given. */
  open: (target?: unknown) => {
    // A click handler passes its event here, which is not a section.
    const found = SECTIONS.find(entry => entry.id === target);
    setQuery('');
    if (isOpen()) {
      if (found) setSection(found.id);
      // As on opening, the section on screen takes the focus, here from a
      // control of the section it replaced.
      document
        .querySelector<HTMLElement>(`[data-settings-section="${section()}"]`)
        ?.focus();
      return;
    }
    const active = document.activeElement;
    opener = active instanceof HTMLElement ? active : undefined;
    if (found) setSection(found.id);
    setOpen(true);
  },
  /** Closes the dialog and gives focus back, which the kit's dialog does not do without a trigger. */
  close: () => {
    if (!isOpen()) return;
    setOpen(false);
    const target = opener?.isConnected ? opener : entryButton();
    queueMicrotask(() => target?.focus());
  },
};
