import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
import {curve, duration, ms} from '../../../components/WhatsNew/motion';

const c = themeVars.dynamicColors;

/*
 * The page of the editor: the header, then the layout the user chose. The
 * harness renders both, so the header sits at the same place in every layout.
 * These are the only numbers behind where it sits:
 *
 * - `inset`, the space between the page's edge and the header's row, on the
 *   top and on the sides. A layout keeps its first islands at the same inset
 *   from the sides, so that the header's edges meet theirs.
 * - `gap`, the space under the row, above the first islands. A layout adds no
 *   space of its own at its top.
 * - `row`, the height of the row, which is the height of its controls.
 */
const inset = '8px';
const gap = '8px';
const row = '36px';
/** Same breakpoint as the app's `useModality`. */
const phone = 'screen and (max-width: 768px)';
// A finger's target on a phone.
const phoneRow = '40px';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',
  overflow: 'hidden',
  background: c.panel.background,
});

// No bar of its own: the logo and the actions sit on the app background, as
// the first row of the layout's islands.
export const header = style({
  position: 'relative',
  // Under the popovers and dialogs of the kit, over the layout's islands.
  zIndex: 30,
  display: 'flex',
  flex: 'none',
  alignItems: 'center',
  gap: themeVars.spacing['3'],
  boxSizing: 'border-box',
  height: `calc(${row} + ${inset} + ${gap})`,
  padding: `${inset} ${inset} ${gap}`,
  color: c.panel.textColor,
  '@media': {
    [phone]: {
      height: `calc(${phoneRow} + ${inset} + ${gap} + env(safe-area-inset-top, 0px))`,
      paddingTop: `calc(${inset} + env(safe-area-inset-top, 0px))`,
    },
  },
});

globalStyle(`${header} button`, {
  '@media': {[phone]: {minWidth: phoneRow, minHeight: phoneRow}},
});

// The islands below have a 22px corner, so a logo flush with their edge looks
// pushed into the corner. This lines it up with where their content starts.
export const brand = style({
  display: 'flex',
  alignItems: 'center',
  paddingLeft: themeVars.spacing['2'],
});

// Centred on the header, as today, whatever sits left and right of it.
export const title = style({
  position: 'absolute',
  inset: `${inset} 0 ${gap}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
});

export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['2'],
  marginLeft: 'auto',
});

// Mobile chrome is redesigned separately; keep the existing phone header.
export const extraButton = style({
  position: 'relative',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  transition: `transform ${ms(duration.press)} ${curve.out}`,
  selectors: {'&:active': {transform: 'scale(.97)'}},
  '@media': {
    [phone]: {display: 'none'},
    '(prefers-reduced-motion: reduce)': {
      transition: 'none',
      selectors: {'&:active': {transform: 'none'}},
    },
  },
});

export const newsIcon = style({
  position: 'relative',
  display: 'flex',
});

export const headerDot = style({
  position: 'absolute',
  top: '-2px',
  right: '-2px',
  display: 'flex',
  color: c.primary,
  pointerEvents: 'none',
});

export const search = style({gap: '8px'});

export const kbd = style({
  font: 'inherit',
  fontSize: '11px',
  color: c.descriptionTextColor,
});
