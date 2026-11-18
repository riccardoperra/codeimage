import {createSignal} from 'solid-js';

type Open = () => void;

const [handler, setHandler] = createSignal<Open | undefined>(undefined, {
  ownedWrite: true,
});
let registered: Open | undefined;

/**
 * Lets the editor on screen open its signature settings when the signature
 * on the canvas is clicked. Without a registered layout the canvas draws the
 * signature as plain, unclickable content, as the export does.
 */
export const signatureEditor = {
  available: () => !!handler(),
  open: () => handler()?.(),
  /** Returns the undo. */
  register(open: Open) {
    registered = open;
    setHandler(() => open);
    return () => {
      if (registered !== open) return;
      registered = undefined;
      setHandler(undefined);
    };
  },
};
