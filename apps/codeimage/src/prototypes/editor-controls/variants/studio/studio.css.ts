import {themeVars} from '@codeimage/ui';
import {
  createContainer,
  createVar,
  globalStyle,
  style,
} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;

/** Same breakpoint as the app's `useModality`, so the production header and this layout agree. */
export const COMPACT_QUERY = '(max-width: 768px)';
const compact = `screen and ${COMPACT_QUERY}`;
const finePointer = '(hover: hover) and (pointer: fine)';
const reducedMotion = '(prefers-reduced-motion: reduce)';
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const gap = '8px';

export const sheetHeight = createVar();
/** Sheet height plus the gap above it, 0 while no sheet is open. */
export const sheetSpace = createVar();

const focusRing = {
  outline: `2px solid ${c.primary}`,
  outlineOffset: '2px',
} as const;

const pressable = style({
  transition: `transform 160ms ${easeOut}`,
  userSelect: 'none',
  WebkitUserSelect: 'none',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  selectors: {
    '&:active:not(:disabled)': {transform: 'scale(0.97)'},
    '&:focus-visible': focusRing,
  },
  '@media': {
    [reducedMotion]: {
      transition: 'none',
      selectors: {'&:active:not(:disabled)': {transform: 'none'}},
    },
  },
});

/** The canvas has always been an island; the control areas now match it. */
const island = style({
  borderRadius: '22px',
  background: c.background,
});

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',
  overflow: 'hidden',
  background: c.panel.background,
  color: c.baseText,
});

export const body = style({
  position: 'relative',
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateAreas: '"rail panel main"',
  gridTemplateColumns: 'auto auto minmax(0, 1fr)',
  gridTemplateRows: 'minmax(0, 1fr)',
  gap,
  padding: `0 ${gap} ${gap}`,
  vars: {[sheetHeight]: '0px', [sheetSpace]: '0px'},
  '@media': {
    [compact]: {
      gridTemplateAreas: '"main" "rail"',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateRows: 'minmax(0, 1fr) auto',
      paddingBottom: `calc(${gap} + env(safe-area-inset-bottom, 0px))`,
    },
  },
});

export const rail = style([
  island,
  {
    gridArea: 'rail',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '76px',
    padding: '10px 0',
    '@media': {
      [compact]: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: 'auto',
        padding: '4px',
        position: 'relative',
        zIndex: 30,
      },
    },
  },
]);

export const railButton = style([
  pressable,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    width: '64px',
    minHeight: '60px',
    padding: '6px 0',
    border: 0,
    borderRadius: '14px',
    background: 'transparent',
    color: c.descriptionTextColor,
    fontFamily: 'inherit',
    fontSize: themeVars.fontSize.xs,
    fontWeight: 500,
    lineHeight: 1.2,
    cursor: 'pointer',
    selectors: {
      '&[aria-expanded="true"]': {color: c.baseText},
    },
    '@media': {
      [finePointer]: {
        selectors: {'&:hover': {color: c.baseText}},
      },
      [compact]: {flex: 1, width: 'auto', minHeight: '56px'},
    },
  },
]);

// The command menu's button sits apart from the panels, at the foot of the rail.
// The command menu's button sits apart from the panels, at the foot of the rail.
// It is not rendered on phones, where the rail is a tab bar sized for five rooms.
export const railSearch = style({
  marginTop: 'auto',
});

export const railHint = style({
  color: c.descriptionTextColor,
  font: 'inherit',
  fontSize: '11px',
  '@media': {[compact]: {display: 'none'}},
});

export const railIcon = style({
  display: 'grid',
  placeItems: 'center',
  width: '44px',
  height: '30px',
  borderRadius: '15px',
  selectors: {
    [`${railButton}[aria-expanded="true"] &`]: {
      background: c.button.primaryAlt.backgroundColor,
      color: c.primary,
    },
  },
  '@media': {
    [finePointer]: {
      selectors: {
        [`${railButton}:hover:not([aria-expanded="true"]) &`]: {
          background: c.input.backgroundColor,
        },
      },
    },
  },
});

export const panel = style([
  island,
  {
    gridArea: 'panel',
    display: 'flex',
    flexDirection: 'column',
    width: '320px',
    minHeight: 0,
    overflow: 'hidden',
    selectors: {
      '&[data-wide]': {width: '372px'},
      '&[hidden]': {display: 'none'},
    },
    '@media': {
      [compact]: {
        position: 'absolute',
        left: gap,
        right: gap,
        bottom: `calc(${gap} + 72px + env(safe-area-inset-bottom, 0px))`,
        zIndex: 20,
        width: 'auto',
        height: sheetHeight,
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.28)',
        selectors: {'&[data-wide]': {width: 'auto'}},
      },
    },
  },
]);

export const sheetGrip = style({
  display: 'none',
  '@media': {
    // A 28px strip, so a sheet without its own header still has a handle to drag.
    [compact]: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '28px',
      selectors: {
        '&::before': {
          content: '""',
          width: '36px',
          height: '5px',
          borderRadius: '3px',
          background: c.input.accentColor,
        },
      },
    },
  },
});

export const panelGrabArea = style({
  flexShrink: 0,
  '@media': {
    [compact]: {
      touchAction: 'none',
      cursor: 'grab',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    },
  },
});

export const panelHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  height: '56px',
  padding: '0 12px 0 16px',
});

export const panelTitle = style({
  flex: 1,
  margin: 0,
  fontSize: themeVars.fontSize.base,
  fontWeight: 600,
  letterSpacing: '-0.01em',
});

export const panelPage = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  selectors: {'&[hidden]': {display: 'none'}},
});

export const panelBody = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  padding: '0 16px 16px 0',
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  selectors: {'& + &': {marginTop: '8px'}},
});

export const fullWidth = style({
  paddingLeft: '15px',
  paddingBottom: '6px',
});

const mainContainer = createContainer();

export const main = style([
  island,
  {
    containerName: mainContainer,
    containerType: 'inline-size',
    gridArea: 'main',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    '@media': {
      [compact]: {height: `calc(100% - ${sheetSpace})`},
    },
  },
]);

export const stage = style({
  position: 'relative',
  flex: 1,
  minHeight: 0,
  display: 'flex',
});

// The production frame toolbar and footer sit absolutely over today's
// canvas; here each gets its own row so neither can cover the frame.
export const frameActions = style({
  display: 'flex',
  justifyContent: 'center',
  padding: '0 16px 12px',
  flexShrink: 0,
});

globalStyle(`${frameActions} > *`, {
  position: 'static',
  transform: 'none',
});

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '0 12px 6px',
  flexShrink: 0,
  '@container': {
    [`${mainContainer} (max-width: 720px)`]: {display: 'none'},
  },
});

globalStyle(`${footer} > *`, {position: 'static'});

export const compactActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px 12px',
  flexShrink: 0,
});

globalStyle(`${compactActions} button`, {
  minHeight: '40px',
  minWidth: '40px',
});

// Themes

export const themeBody = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '0 16px',
});

export const presetsHost = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  padding: '4px 12px 12px 16px',
  overflow: 'hidden',
});

// The kit's buttons and segmented controls move when pressed. With reduced
// motion they keep their colour changes and drop the movement.
globalStyle(`${root} *`, {
  '@media': {
    [reducedMotion]: {
      transitionProperty:
        'color, background-color, border-color, opacity, box-shadow !important',
    },
  },
});
