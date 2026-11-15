import {createVar, globalStyle, style} from '@vanilla-extract/css';

/** How far down the page starts, under the pills, when they would cover it. */
export const offset = createVar('proto-offset');

/*
 * The picker pills sit in one row at the top center, the place PICKER.md
 * gives a single pill. They keep its look: only their positioning moves to
 * this container, so that two pills sit side by side or wrap.
 */
export const pickers = style({
  position: 'fixed',
  top: '24px',
  left: '50%',
  transform: 'translateX(-50%)',
  // Above the page (the production header is at 30), below what the page
  // opens on top of it: the kit's popovers and dialogs sit at 40 and 50.
  zIndex: 35,
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '8px',
  width: 'max-content',
  maxWidth: 'calc(100vw - 32px)',
  pointerEvents: 'none',
});

/** A pill in the row, in place of its own fixed position. */
export const pill = style({
  selectors: {
    [`${pickers} > &[data-position]`]: {
      position: 'relative',
      top: 'auto',
      bottom: 'auto',
      left: 'auto',
      transform: 'none',
      pointerEvents: 'auto',
    },
  },
});

/*
 * Where the pills would cover a control, the page starts under them and the
 * variant's root fills what is left in place of 100dvh. The body clips what
 * overflows it and positions the popovers portaled to it, so it keeps the
 * viewport's height once the page leaves the flow.
 */
export const harness = style({
  selectors: {
    '&[data-offset]': {height: '100dvh'},
  },
});

export const variant = style({
  selectors: {
    [`${harness}[data-offset] > &`]: {
      position: 'fixed',
      inset: `${offset} 0 0`,
    },
  },
});

// The child is the root of whichever variant the registry renders, so the
// rule cannot sit on a class of its own.
globalStyle(`${harness}[data-offset] > ${variant} > *`, {
  height: '100%',
});
