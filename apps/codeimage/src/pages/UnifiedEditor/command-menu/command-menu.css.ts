import {themeVars} from '@codeimage/ui';
import {createVar, fallbackVar, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;

/*
 * At the bottom centre and short, with no scrim: the canvas is the preview,
 * so most of the frame has to stay in view while the list is walked.
 */
export const menu = style({
  position: 'fixed',
  left: '50%',
  bottom: '16px',
  // Over the page and its popovers, as the kit's dialogs are.
  zIndex: 50,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  width: 'min(640px, calc(100vw - 32px))',
  padding: themeVars.spacing['2'],
  borderRadius: '22px',
  transform: 'translateX(-50%)',
  background: c.dialog.panelBackgroundColor,
  boxShadow: c.dialog.panelShadow,
  color: c.baseText,
  fontSize: themeVars.fontSize.sm,
  outline: 'none',
  '@media': {
    // A phone keyboard covers the bottom of the window.
    '(max-width: 767px)': {top: '8px', bottom: 'auto'},
  },
});

export const field = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['3'],
  height: '44px',
  padding: `0 ${themeVars.spacing['3']}`,
  borderRadius: '14px',
  background: c.input.backgroundColor,
  color: c.descriptionTextColor,
});

export const input = style({
  flex: 1,
  minWidth: 0,
  border: 0,
  outline: 'none',
  background: 'transparent',
  color: c.input.textColor,
  font: 'inherit',
  '@media': {
    // Below 16px a phone zooms the page into the field.
    '(max-width: 767px)': {fontSize: '16px'},
  },
});

export const hint = style({
  flex: 'none',
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
  '@media': {'(max-width: 767px)': {display: 'none'}},
});

// Six rows: enough to walk a group, short enough to see the frame above.
export const list = style({
  maxHeight: '236px',
  marginTop: themeVars.spacing['1'],
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  scrollPadding: themeVars.spacing['2'],
  scrollbarWidth: 'thin',
  // A standard scrollbar width turns off the app's ::-webkit-scrollbar rules,
  // so the colour has to be set here too or the browser draws its light default.
  scrollbarColor: `${themeVars.dynamicColors.scrollBar.backgroundColor} transparent`,
});

export const group = style({
  padding: `${themeVars.spacing['3']} ${themeVars.spacing['3']} ${themeVars.spacing['1']}`,
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
  fontWeight: themeVars.fontWeight.semibold,
});

// The section a group belongs to reads as a path before the group's name.
export const groupSection = style({
  fontWeight: themeVars.fontWeight.normal,
});

export const groupSlash = style({
  margin: `0 ${themeVars.spacing['1']}`,
  fontWeight: themeVars.fontWeight.normal,
  opacity: 0.6,
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['2'],
  height: '36px',
  padding: `0 ${themeVars.spacing['3']}`,
  borderRadius: '10px',
  cursor: 'pointer',
  selectors: {
    '&[aria-selected="true"]': {background: c.input.backgroundColor},
  },
  '@media': {'(max-width: 767px)': {height: '44px'}},
});

// One box for a theme orb, a fill, an icon or a language, so that the text of
// every row in a group starts at the same place.
export const leading = style({
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  width: '20px',
  height: '20px',
  color: c.descriptionTextColor,
  selectors: {
    [`${row}[aria-selected="true"] &`]: {color: c.baseText},
  },
});

export const fillValue = createVar();

export const fill = style({
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: fallbackVar(fillValue, 'transparent'),
  // A hairline keeps a fill the colour of the panel visible.
  boxShadow: 'inset 0 0 0 1px rgba(127, 127, 127, 0.35)',
});

export const label = style({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const check = style({flex: 'none', color: c.primary});

export const note = style({
  flex: 'none',
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
});

export const empty = style({
  margin: 0,
  padding: themeVars.spacing['3'],
  color: c.descriptionTextColor,
});
