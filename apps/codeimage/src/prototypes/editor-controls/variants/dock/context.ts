import type {Accessor} from 'solid-js';
import {createContext, createSignal, onCleanup, useContext} from 'solid-js';
import type {EditorControlsModel} from '../../model';
import type {Stage} from '../../stage';
import type {Fields, PanelId} from './fields';
import type {Previewable, PreviewSession} from './preview';

export interface DockApi {
  readonly model: EditorControlsModel;
  readonly stage: Stage;
  readonly fields: Fields;
  readonly session: PreviewSession;
  /** Key of the change the canvas is previewing, if any. */
  readonly previewKey: Accessor<string | undefined>;
  /** The panel the tray shows, if it is open. */
  readonly panel: Accessor<PanelId | undefined>;
  /** True on a phone-width window, where the dock is the bottom bar and trays are sheets. */
  readonly compact: Accessor<boolean>;
  readonly open: (panel: PanelId) => void;
  /** Closes the tray. A preview that was not kept is taken back. */
  readonly close: () => void;
  readonly keep: (change: Previewable) => void;
  /**
   * After a pick in a tray that holds one list. A pointer that can hover has
   * already seen the preview, so the pick is final. A finger has not, so the
   * tray stays for the next try.
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

/**
 * The harness picker switches variants on digits, R and the arrows. It
 * listens on the document, where Solid's delegated handlers also run, so
 * only stopping the remaining document listeners keeps a key from it.
 */
export const keepFromPicker = (event: KeyboardEvent) =>
  event.stopImmediatePropagation();
