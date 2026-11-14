import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';

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

export const brand = style({display: 'flex', alignItems: 'center'});

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
