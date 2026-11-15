import {themeVars} from '@codeimage/ui';
import {
  createVar,
  fallbackVar,
  globalStyle,
  keyframes,
  style,
} from '@vanilla-extract/css';
import {segmentedHeight} from '../../controls/controls.css';

/*
 * Controls are the kit's and keep the kit's own look, so the rules here are
 * the layout and its surfaces.
 */

const c = themeVars.dynamicColors;
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const easeDrawer = 'cubic-bezier(0.32, 0.72, 0, 1)';
const gap = '8px';
const radius = '22px';
const phone = '(max-width: 767px)';
const reducedMotion = '(prefers-reduced-motion: reduce)';

/** The height the dock keeps free at the bottom of the canvas. */
export const safe = createVar('dock-safe');
/** The width of one theme card in the popover's row. */
const card = createVar('dock-card');

const popoverIn = keyframes({
  from: {opacity: 0, transform: 'translateY(6px) scale(0.98)'},
});
const fadeIn = keyframes({from: {opacity: 0}});
const sheetIn = keyframes({from: {transform: 'translateY(100%)'}});
const sheetOut = keyframes({to: {transform: 'translateY(100%)'}});

export const root = style({
  /*
   * In the page flow, not fixed: the body clips what leaves its box, and a
   * body without content is 0px tall, which would hide every kit popover.
   */
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  // Under the page's header, which the harness renders: the rest of the page.
  flex: 1,
  minHeight: 0,
  paddingBottom: gap,
  overflow: 'hidden',
  background: c.panel.background,
  color: c.baseText,
  fontSize: themeVars.fontSize.sm,
  '@media': {
    [phone]: {paddingBottom: 0},
  },
});

/*
 * The kit's buttons and segmented controls move when pressed. With reduced
 * motion they keep their colour changes and drop the movement.
 */
globalStyle(`${root} *`, {
  '@media': {
    [reducedMotion]: {
      transitionProperty:
        'color, background-color, border-color, opacity, box-shadow !important',
    },
  },
});

// The canvas is an island on the app background, as today.
export const island = style({
  borderRadius: radius,
  background: c.background,
});

// What floats over the canvas, the dock and the frame actions, takes the
// surface and shadow of the kit's dialogs.
export const float = style({
  borderRadius: radius,
  background: c.dialog.panelBackgroundColor,
  boxShadow: c.dialog.panelShadow,
});

// The kit's segmented control fills its parent, so it gets one with a size.
export const segmented = style({
  vars: {[segmentedHeight]: '32px'},
  display: 'flex',
  height: '32px',
});

/* Canvas */

export const body = style({
  position: 'relative',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  minHeight: 0,
  margin: `0 ${gap}`,
  '@media': {
    [phone]: {margin: 0},
  },
});

export const stage = style({
  position: 'relative',
  order: 1,
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
  '@media': {
    [phone]: {borderRadius: `${radius} ${radius} 0 0`},
  },
});

/*
 * The canvas keeps the height of the dock free at its bottom, so the frame is
 * centred in the space above the dock and the dock at rest never covers it.
 */
export const canvas = style({
  position: 'relative',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  boxSizing: 'border-box',
  minHeight: 0,
  paddingBottom: safe,
  overflow: 'hidden',
  '@media': {
    [phone]: {paddingBottom: 0},
  },
});

export const footer = style({
  position: 'absolute',
  right: 0,
  bottom: safe,
});

// The production footer brings its own position.
globalStyle(`${footer} > div`, {
  position: 'static',
});

/* Dock */

/*
 * Over the bottom edge of the canvas, and out of the layout. On a window too
 * narrow for one line the frame actions wrap above the bar, so the bar stays
 * at the bottom and popovers open over the actions, not over more canvas.
 */
export const row = style({
  position: 'absolute',
  right: 0,
  bottom: '12px',
  left: 0,
  zIndex: 2,
  display: 'flex',
  flexWrap: 'wrap-reverse',
  justifyContent: 'center',
  gap,
  // The gaps beside the islands let clicks through to the canvas.
  pointerEvents: 'none',
  '@media': {
    [phone]: {
      position: 'relative',
      bottom: 'auto',
      order: 3,
      padding: 0,
    },
  },
});

// Phone: the dock is the bottom bar, in the layout, and every panel is a
// short sheet above it.
export const bar = style({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  boxSizing: 'border-box',
  minWidth: 0,
  maxWidth: '100%',
  height: '56px',
  padding: '0 8px',
  // An island of the row, which lets clicks through around it.
  pointerEvents: 'auto',
  '@media': {
    [phone]: {
      width: '100%',
      height: 'auto',
      justifyContent: 'space-between',
      gap: 0,
      padding: '6px 8px calc(6px + env(safe-area-inset-bottom, 0px))',
      borderRadius: 0,
      background: c.panel.background,
      boxShadow: 'none',
    },
  },
});

// A kit button of the bar.
export const item = style({
  selectors: {
    [`${root} &`]: {
      flex: 'none',
      gap: '8px',
      paddingInline: '10px',
    },
    [`${root} &[aria-expanded='true']`]: {
      background: c.input.backgroundColor,
    },
  },
  '@media': {
    [phone]: {
      selectors: {
        [`${root} &`]: {
          flex: '1 1 0',
          flexDirection: 'column',
          gap: '4px',
          minWidth: '40px',
          height: '52px',
          padding: '0 2px',
          fontSize: '10px',
          fontWeight: 500,
        },
      },
    },
  },
});

export const itemText = style({
  display: 'inline-grid',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  '@media': {
    [phone]: {
      minWidth: 0,
      maxWidth: '100%',
      width: '100%',
      gridTemplateColumns: 'minmax(0, 1fr)',
      textAlign: 'center',
    },
  },
});

// The label and the hidden copies of the other values share one cell.
export const itemCell = style({
  gridArea: '1 / 1',
  '@media': {
    [phone]: {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
});

export const itemSizer = style([itemCell, {visibility: 'hidden'}]);

export const fill = style({
  display: 'block',
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  boxShadow: 'inset 0 0 0 1px rgba(128, 128, 128, 0.35)',
  selectors: {
    '&[data-hidden]': {
      background:
        'repeating-conic-gradient(rgba(128, 128, 128, 0.35) 0 25%, transparent 0 50%) 0 0 / 8px 8px !important',
    },
  },
});

export const fontIcon = style({
  fontWeight: 500,
});

export const field = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '0 8px',
});

export const fieldPadding = style({});

export const fieldLanguage = style({});

// The child is the shared select's root.
globalStyle(`${fieldLanguage} > *`, {
  width: '112px',
});

export const paddingChoice = style({
  selectors: {
    [`${fieldPadding} > &:last-child`]: {width: '152px'},
  },
});

export const icon = style({
  flex: 'none',
  selectors: {
    [`${field} > &`]: {color: c.descriptionTextColor},
  },
});

export const kbd = style({
  color: c.descriptionTextColor,
  font: 'inherit',
  fontSize: themeVars.fontSize.xs,
});

export const barExport = style({
  display: 'flex',
  alignItems: 'center',
  marginLeft: 'auto',
  paddingLeft: '4px',
});

export const frameActions = style({
  display: 'flex',
  alignItems: 'center',
  height: '56px',
  padding: '0 4px',
  // An island of the row, which lets clicks through around it.
  pointerEvents: 'auto',
});

// The canvas toolbar takes the dock's surface.
globalStyle(`${frameActions} > *`, {background: 'transparent'});

/* Popovers */

export const overlays = style({
  position: 'absolute',
  top: 0,
  left: 0,
});

export const popover = style({
  borderRadius: radius,
  background: c.dialog.panelBackgroundColor,
  boxShadow: c.dialog.panelShadow,
  boxSizing: 'border-box',
  width: '364px',
  maxWidth: 'calc(100vw - 16px)',
  maxHeight: 'var(--kb-popper-content-available-height)',
  overflow: 'auto',
  overscrollBehavior: 'contain',
  outline: 'none',
  // Over the dock, the header and the harness pills, as the kit's popovers are.
  zIndex: 40,
  transformOrigin: 'var(--kb-popover-content-transform-origin)',
  animation: `${popoverIn} 160ms ${easeOut}`,
  selectors: {
    // Opened from the keyboard, so it appears at once.
    '&[data-instant]': {animation: 'none'},
    "&[data-panel='background']": {width: '392px'},
  },
  '@media': {
    [reducedMotion]: {animation: `${fadeIn} 160ms ease`},
  },
});

export const panel = style({
  padding: '4px 16px 16px',
  '@media': {
    [phone]: {
      padding: '0 16px calc(16px + env(safe-area-inset-bottom, 0px))',
    },
  },
});

export const empty = style({
  margin: 0,
  padding: '8px 0 12px',
  color: c.descriptionTextColor,
});

/*
 * Themes. The canvas under the panel is the preview, so the panel is short:
 * the shared picker's cards sit in one row that scrolls sideways. The Aa list
 * is a column, in a narrow panel of its own.
 */

export const themes = style({
  paddingTop: '16px',
  '@media': {
    // The picker fills the sheet under its grabber, so only its list scrolls.
    [phone]: {
      height: 'calc(40dvh - 20px)',
      paddingTop: '4px',
    },
  },
});

// The shared theme picker's list and grid, inside the popover.
globalStyle(`${popover} [data-theme-list]`, {
  flex: 'none',
  overflowX: 'auto',
  overscrollBehaviorX: 'contain',
  scrollPaddingInline: '12px',
});

globalStyle(
  `${popover} [data-theme-style]:not([data-theme-style='aa']) [data-theme-list]`,
  {paddingBottom: '8px'},
);

globalStyle(
  `${popover} [data-theme-style]:not([data-theme-style='aa']) [data-theme-list] > div`,
  {
    gridTemplateColumns: 'none',
    // Twelve orb cards across the dock at 1440px.
    gridAutoColumns: fallbackVar(card, '109px'),
    gridAutoFlow: 'column',
    gap: '4px',
    width: 'max-content',
  },
);

globalStyle(`${popover} [data-theme-style='window']`, {
  vars: {[card]: '148px'},
});

// Twelve rows on a 900px window. The list is narrow and sits beside the
// frame there.
globalStyle(`${popover} [data-theme-style='aa'] [data-theme-list]`, {
  maxHeight: 'min(576px, 62dvh)',
});

/* Lists inside a popover */

export const list = style({
  maxHeight: '208px',
  marginTop: '12px',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  '@media': {
    [phone]: {maxHeight: 'none', overflow: 'visible'},
  },
});

export const fontStyle = style({
  paddingTop: '8px',
});

export const more = style({});

export const group = style({
  minWidth: 0,
  selectors: {
    [`${more} &`]: {paddingTop: '8px'},
  },
});

// Today's row gives the label 38% of a 280px sidebar. Here the longest label
// needs more. The rows are the production ones.
globalStyle(
  `${more} ${group} > [data-control] > div, ${fontStyle} > [data-control] > div`,
  {gridTemplateColumns: 'minmax(0, 2fr) repeat(2, minmax(0, 1fr))'},
);

export const phoneActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  paddingTop: '16px',
});

/* The phone's sheet */

export const sheetSlot = style({
  '@media': {
    [phone]: {
      position: 'relative',
      zIndex: 1,
      order: 2,
      display: 'flex',
      minWidth: 0,
    },
  },
});

export const sheet = style({
  '@media': {
    [phone]: {
      position: 'relative',
      boxSizing: 'border-box',
      flex: 'none',
      width: '100%',
      maxHeight: '40dvh',
      overflow: 'auto',
      overscrollBehavior: 'contain',
      outline: 'none',
      borderRadius: `${radius} ${radius} 0 0`,
      background: c.panel.background,
      animation: `${sheetIn} 280ms ${easeDrawer}`,
      selectors: {
        '&[data-closed]': {animation: `${sheetOut} 200ms ${easeOut} forwards`},
        '&[data-dragged]': {animation: 'none'},
      },
    },
    [reducedMotion]: {
      animation: `${fadeIn} 160ms ease`,
      selectors: {
        '&[data-closed]': {animation: 'none'},
      },
    },
  },
});

// The portal's own wrapper.
globalStyle(`${sheetSlot} > div:not(${sheet})`, {
  '@media': {
    [phone]: {display: 'contents'},
  },
});

export const grabber = style({
  '@media': {
    [phone]: {
      position: 'sticky',
      top: 0,
      zIndex: 1,
      display: 'block',
      width: '100%',
      height: '20px',
      padding: 0,
      border: 0,
      background: c.panel.background,
      touchAction: 'none',
      cursor: 'grab',
      selectors: {
        '&::before': {
          content: '',
          display: 'block',
          width: '36px',
          height: '4px',
          margin: '0 auto',
          borderRadius: '2px',
          background: c.button.base.backgroundColor,
        },
      },
    },
  },
});
