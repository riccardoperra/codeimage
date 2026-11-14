import type {Accessor, Component} from 'solid-js';
import {createContext, createSignal, onCleanup, useContext} from 'solid-js';
import type {EditorControlsModel} from '../../model';
import type {Stage} from '../../stage';
import type {ThemePickerSlotProps} from '../../theme-styles/ThemePicker';
import type {Fields, PanelId} from './fields';

export interface DockApi {
  readonly model: EditorControlsModel;
  readonly stage: Stage;
  readonly fields: Fields;
  readonly ThemePicker: Component<ThemePickerSlotProps>;
  /** The panel that is open, in a popover or, on a phone, in the sheet. */
  readonly panel: Accessor<PanelId | undefined>;
  /** True on a phone-width window, where the dock is the bottom bar and panels are sheets. */
  readonly compact: Accessor<boolean>;
  readonly close: () => void;
  /**
   * After a pick in a panel that holds one list. A pointer that can hover has
   * already seen the preview, so the pick is final. A finger has not, so the
   * panel stays for the next try.
   */
  readonly closeAfterPick: (byKeyboard: boolean) => void;
}

export const DockContext = createContext<DockApi>();

export function useDock(): DockApi {
  const dock = useContext(DockContext);
  if (!dock) throw new Error('useDock must be called inside the Dock variant');
  return dock;
}

export function createMediaQuery(query: string): Accessor<boolean> {
  const media = window.matchMedia(query);
  const [matches, setMatches] = createSignal(media.matches);
  const update = () => setMatches(media.matches);
  media.addEventListener('change', update);
  onCleanup(() => media.removeEventListener('change', update));
  return matches;
}

/** A click that came from Enter or Space reports no pointer detail. */
export const isKeyboardClick = (event: MouseEvent) => event.detail === 0;

/** The harness pills are chrome: using them must not close what the dock has open. */
export const inPrototypeChrome = (target: EventTarget | null) =>
  target instanceof Element && !!target.closest('[data-prototype-chrome]');

/**
 * The kit's segmented control and lists take Escape for themselves, and
 * Kobalte then leaves the surface around them open. This closes it from a
 * native listener on the surface, which a list that opened outside it, such
 * as a select's, does not reach.
 */
export const closeOnEscape = (close: () => void) => (event: KeyboardEvent) => {
  if (event.key === 'Escape') close();
};
