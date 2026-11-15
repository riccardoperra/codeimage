import {style} from '@vanilla-extract/css';

const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';

export const picker = style({
  position: 'fixed',
  bottom: '24px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 2147483647,
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  padding: '4px',
  borderRadius: '999px',
  background: 'rgba(10, 10, 10, 0.82)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  boxShadow:
    '0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 8px 24px rgba(0, 0, 0, 0.24), 0 2px 6px rgba(0, 0, 0, 0.12)',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: '13px',
  lineHeight: 1,
  WebkitFontSmoothing: 'antialiased',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  selectors: {
    '&[data-position="top"]': {
      bottom: 'auto',
      top: '24px',
    },
  },
});

export const highlight = style({
  position: 'absolute',
  top: '4px',
  left: 0,
  height: '28px',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, 0.12)',
  selectors: {
    // The slide is enabled only after first paint (data-ready), so load
    // doesn't animate.
    [`${picker}[data-ready] &`]: {
      transition: `transform 250ms ${easeOut}, width 250ms ${easeOut}`,
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      selectors: {
        [`${picker}[data-ready] &`]: {transition: 'none'},
      },
    },
  },
});

export const item = style({
  position: 'relative', // sits above the highlight
  display: 'flex',
  alignItems: 'center',
  height: '28px',
  padding: '0 12px',
  border: 0,
  borderRadius: '999px',
  background: 'transparent',
  color: 'rgba(255, 255, 255, 0.55)',
  font: 'inherit',
  cursor: 'pointer',
  transition: `color 150ms ease-out, transform 160ms ${easeOut}`,
  selectors: {
    '&:active': {transform: 'scale(0.97)'},
    '&:focus-visible': {
      outline: '2px solid rgba(255, 255, 255, 0.4)',
      outlineOffset: '2px',
    },
    '&[data-active]': {color: '#fff'},
  },
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        // The active item stays white, as it did when its rule came last.
        '&:hover:not([data-active])': {color: 'rgba(255, 255, 255, 0.85)'},
      },
    },
  },
});

export const divider = style({
  width: '1px',
  height: '16px',
  margin: '0 4px',
  background: 'rgba(255, 255, 255, 0.12)',
});

export const replay = style({
  padding: '0 10px',
  fontSize: '14px',
});
