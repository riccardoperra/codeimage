import {themeVars} from '@codeimage/ui';
import {createVar, globalStyle, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const phone = '(max-width: 768px)';
const wide = '(min-width: 769px)';
const finePointer = '(hover: hover) and (pointer: fine)';
const reducedMotion = '(prefers-reduced-motion: reduce)';

/** The height the open section's body animates to. */
export const bodyHeight = createVar('sidebar-body-height');
/** How tall the phone's sheet may grow under the page's header. */
export const tallSheet = createVar('sidebar-tall-sheet');

// The layout, under the page's header, which the harness renders: the rest
// of the page.
export const root = style({
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateRows: 'minmax(0, 1fr)',
  overflow: 'hidden',
  background: c.panel.background,
  color: c.baseText,
  font: '13px/1.5 Inter, system-ui, sans-serif',
  WebkitTapHighlightColor: 'transparent',
});

// The kit's and the production controls inside are sized as border boxes.
globalStyle(`${root} *, ${root} *::before, ${root} *::after`, {
  boxSizing: 'border-box',
  '@media': {
    [reducedMotion]: {
      animation: 'none !important',
      transition: 'none !important',
      // The type of a keyword-only property has no room for !important.
      scrollBehavior: 'auto !important' as 'auto',
    },
  },
});

// Every button of the layout, the kit's included.
globalStyle(`${root} button`, {
  touchAction: 'manipulation',
});

globalStyle(
  `${root} button:focus-visible, ${root} input:focus-visible, ${root} [tabindex]:focus-visible`,
  {
    outline: `2px solid ${c.primary}`,
    outlineOffset: '3px',
  },
);

/*
 * data-panel-side="left", on the root or on any ancestor the settings
 * own, puts the panel before the canvas. Phones keep the bottom sheet.
 */
const left = `[data-panel-side='left'] ${root} &, ${root}[data-panel-side='left'] &`;

export const workspace = style({
  minHeight: 0,
  minWidth: 0,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 360px',
  // The page's inset, which the header shares, on the sides and between the islands.
  gap: '8px',
  padding: '0 8px 8px',
  selectors: {
    "[data-page-state='read-only'] &": {
      gridTemplateRows: 'minmax(0, 1fr)',
    },
  },
  '@media': {
    [wide]: {
      selectors: {[left]: {gridTemplateColumns: '360px minmax(0, 1fr)'}},
    },
    [phone]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateRows: 'minmax(0, 1fr) auto auto',
      padding: '0 8px 8px',
      gap: '8px',
    },
  },
});

export const canvas = style({
  minWidth: 0,
  minHeight: 0,
  display: 'grid',
  gridTemplateRows: 'minmax(0, 1fr) auto auto',
  overflow: 'hidden',
  borderRadius: '22px',
  background: c.background,
  selectors: {
    "[data-page-state='read-only'] &": {gridColumn: '1 / -1'},
  },
  '@media': {
    [phone]: {
      selectors: {
        [`${root}[data-sheet='tall'] &`]: {gridTemplateRows: 'minmax(0, 1fr)'},
      },
    },
  },
});

export const stage = style({
  display: 'flex',
  minHeight: 0,
  minWidth: 0,
  overflow: 'hidden',
});

// The production frame inside the stage.
globalStyle(`${root} ${stage} *`, {
  transition: 'none !important',
});

export const frameActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '8px 12px 12px',
  '@media': {
    [phone]: {
      flexWrap: 'wrap',
      padding: '4px 8px 8px',
      selectors: {
        [`${root}[data-sheet='tall'] &`]: {display: 'none'},
      },
    },
  },
});

export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
  padding: '12px 16px',
  borderRadius: '22px',
  background: c.background,
  overflow: 'hidden',
  '@media': {
    [wide]: {
      selectors: {[left]: {order: -1}},
    },
    [phone]: {
      padding: '0 12px 12px',
      selectors: {
        [`${root}[data-sheet='tall'] &`]: {height: tallSheet},
      },
    },
  },
});

// The kit's buttons in the panel do not animate.
globalStyle(`${root} ${panel} button`, {
  animation: 'none',
  transition: 'none',
});

globalStyle(`${root} ${panel} [data-cui='segmentedcontrol-indicator']`, {
  animation: 'none',
  transition: 'none',
});

// On a phone every target in the panel is 40px. The shared theme filter keeps
// the kit's 40px, as in the other layouts.
globalStyle(
  [
    `${root} ${panel} button:not([data-theme-style] [data-cui='segmentedcontrol-item'])`,
    `${root} ${panel} [role='tab']:not([data-theme-style] *)`,
    `${root} ${panel} [role='radio']`,
    `${root} ${panel} [role='option']`,
  ].join(', '),
  {
    '@media': {
      [phone]: {minHeight: '40px', minWidth: '40px'},
    },
  },
);

// A kit button.
export const panelScroll = style({
  display: 'flex',
  flex: '1 1 auto',
  flexDirection: 'column',
  gap: '4px',
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  scrollbarWidth: 'thin',
  scrollbarColor: `${c.button.base.hoverColor} transparent`,
  '@media': {
    [phone]: {
      selectors: {
        [`${root}[data-sheet='short'] &`]: {display: 'none'},
      },
    },
  },
});

/*
 * A header is a 36px row with its own weight and a hover surface. The open
 * section sits on a quieter inner island with its content inset, so the
 * group reads apart from the rows it holds and from the closed headers.
 */
export const section = style({
  flex: 'none',
  borderRadius: '16px',
  selectors: {
    '&[data-open]': {background: c.panel.background},
  },
});

export const sectionTrigger = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  minHeight: '36px',
  padding: '0 12px 0 8px',
  border: 0,
  borderRadius: '12px',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  fontSize: '14px',
  fontWeight: 600,
  textAlign: 'left',
  cursor: 'pointer',
  '@media': {
    [finePointer]: {
      selectors: {
        [`${section}:not([data-open]) > &:hover`]: {
          background: c.button.base.hoverColor,
        },
      },
    },
  },
});

export const sectionName = style({flex: 1});

export const sectionIcon = style({
  display: 'grid',
  placeItems: 'center',
  color: c.descriptionTextColor,
  selectors: {
    [`${sectionTrigger}[aria-expanded='true'] &`]: {color: c.primary},
  },
});

export const chevron = style({
  display: 'inline-block',
  width: '16px',
  font: '20px/1 system-ui',
  textAlign: 'center',
  color: c.descriptionTextColor,
  transition: `transform 200ms ${easeOut}`,
  selectors: {
    [`${sectionTrigger}[aria-expanded='true'] &`]: {transform: 'rotate(90deg)'},
  },
});

export const summary = style({
  maxWidth: '55%',
  color: c.descriptionTextColor,
  fontSize: '12px',
  fontWeight: 400,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

/*
 * The body animates its measured height, the one layout property the
 * accordion recipe allows, with opacity, so a click retargets mid-way.
 */
export const sectionBody = style({
  height: 0,
  overflow: 'hidden',
  opacity: 0,
  transition: `height 200ms ${easeOut}, opacity 200ms ${easeOut}`,
  selectors: {
    [`${section}[data-open] > &`]: {height: bodyHeight, opacity: 1},
  },
});

export const sectionContent = style({
  padding: '0 8px 8px',
  selectors: {
    // The theme list keeps its own bottom padding for the focus ring.
    [`${section}[data-section='themes'] &`]: {paddingBottom: 0},
  },
});

export const themes = style({
  position: 'relative',
  height: bodyHeight,
});

// The child is the root of the shared theme picker the layout renders.
globalStyle(`${themes} > *`, {
  position: 'absolute',
  inset: 0,
});

// A kit button: the grip that drags the phone's sheet.
export const sheetHandle = style({
  selectors: {
    [`${root} &`]: {display: 'none'},
  },
  '@media': {
    [phone]: {
      selectors: {
        [`${root} &`]: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          minHeight: '40px',
          padding: 0,
          touchAction: 'pan-x',
        },
      },
    },
  },
});

export const sheetGrip = style({
  '@media': {
    [phone]: {
      width: '32px',
      height: '4px',
      background: c.descriptionTextColor,
      borderRadius: '99px',
    },
  },
});

export const quickControls = style({
  display: 'none',
  '@media': {
    [phone]: {
      display: 'grid',
      gridTemplateColumns: '40px 0.85fr 1.3fr 0.9fr 1fr',
      gap: '2px',
      selectors: {
        [`${root}[data-sheet='tall'] &`]: {display: 'none'},
      },
    },
  },
});

// The kit's buttons of the quick controls.
globalStyle(`${root} ${quickControls} button`, {
  '@media': {
    [phone]: {minWidth: 0, padding: '4px', fontSize: '12px'},
  },
});

// Overlays render outside the root, so these rules are global.
globalStyle(
  `[data-popper-positioner] [data-keys]:focus-visible, ${root} [data-keys]:focus-visible`,
  {
    outline: '2px solid Highlight',
    outlineOffset: '2px',
  },
);
