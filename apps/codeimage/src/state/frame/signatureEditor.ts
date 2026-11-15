import {createSignal} from 'solid-js';

type Open = () => void;

const [handler, setHandler] = createSignal<Open | undefined>();

/**
 * Lets the editor on screen open its signature settings when the signature
 * on the canvas is clicked. Without a registered layout the canvas draws the
 * signature as plain, unclickable content, as `/classic` and the export do.
 */
export const signatureEditor = {
  available: () => !!handler(),
  open: () => handler()?.(),
  /** Returns the undo. */
  register(open: Open) {
    setHandler(() => open);
    return () => {
      if (handler() === open) setHandler(undefined);
    };
  },
};
