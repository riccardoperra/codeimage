import {themeVars} from '@codeimage/ui';
import {createVar, fallbackVar, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
/** Same breakpoint as the app's `useModality`. */
const compact = 'screen and (max-width: 768px)';
const reducedMotion = '(prefers-reduced-motion: reduce)';
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const focusRing = {
  outline: `2px solid ${c.primary}`,
  outlineOffset: '2px',
} as const;

/** Carries `data-control` for a row without adding a box to the layout. */
export const row = style({display: 'contents'});

// The kit has no switch: Kobalte's, drawn with the app's tokens.

export const switchRoot = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
});

export const switchControl = style({
  position: 'relative',
  flexShrink: 0,
  width: '36px',
  height: '22px',
  borderRadius: '11px',
  background: c.button.base.backgroundColor,
  cursor: 'pointer',
  transition: 'background-color 120ms ease',
  selectors: {
    '&[data-checked]': {background: c.primary},
    [`${switchRoot}:has(input:focus-visible) &`]: focusRing,
  },
  '@media': {
    [compact]: {width: '44px', height: '26px', borderRadius: '13px'},
    [reducedMotion]: {transition: 'none'},
  },
});

export const switchThumb = style({
  position: 'absolute',
  top: '3px',
  left: '3px',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: '#fff',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  transition: `transform 120ms ${easeOut}`,
  selectors: {
    '&[data-checked]': {transform: 'translateX(14px)'},
  },
  '@media': {
    [compact]: {
      width: '20px',
      height: '20px',
      selectors: {'&[data-checked]': {transform: 'translateX(18px)'}},
    },
    [reducedMotion]: {transition: 'none'},
  },
});

/** The height a layout gives its segmented controls, when it sets one. */
export const segmentedHeight = createVar('proto-segmented-height');

/*
 * SegmentedField's adapt makes the kit control height: 100%, which falls back
 * to its line height under a parent of auto height. The kit's field heights
 * give that 100% something to resolve against. A layout with its own height
 * sets segmentedHeight.
 */
export const segmented = style({
  width: '100%',
  height: fallbackVar(segmentedHeight, '36px'),
  selectors: {
    '&[data-size="md"]': {height: fallbackVar(segmentedHeight, '40px')},
  },
});

// Window style tiles: each style drawn small, the way the frame will show it.

export const windowGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '10px',
  width: '100%',
});

export const windowTile = style({
  position: 'relative',
  height: '84px',
  overflow: 'hidden',
  borderRadius: '14px',
  background: c.input.backgroundColor,
  cursor: 'pointer',
  selectors: {
    '&[data-checked]': {boxShadow: `inset 0 0 0 2px ${c.primary}`},
    '&:has(input:focus-visible)': focusRing,
  },
});

export const windowTileLabel = style({
  position: 'absolute',
  inset: 0,
  cursor: 'pointer',
  zIndex: 1,
});

export const windowTilePreview = style({
  position: 'absolute',
  top: '10px',
  left: '10px',
  width: '230px',
  zoom: 0.5,
  pointerEvents: 'none',
});

export const windowTileCaption = style({
  position: 'absolute',
  left: '12px',
  bottom: '8px',
  fontSize: themeVars.fontSize.xs,
  fontWeight: 500,
  color: c.descriptionTextColor,
  pointerEvents: 'none',
  selectors: {[`${windowTile}[data-checked] &`]: {color: c.baseText}},
});

export const visuallyHidden = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});
