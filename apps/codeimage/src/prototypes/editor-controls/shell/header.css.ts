import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;

/*
 * No bar of its own: the logo and the actions sit on the app background as
 * the first row of the layout's islands. The row is as tall as its controls,
 * 36px, and takes its spacing from the layout through two custom properties,
 * so that its edges meet the islands' outer edges and the space under it is
 * the space between two islands:
 *
 * - `--shell-inset`, the space between the page's edge and the islands;
 * - `--shell-gap`, the space under the header, the inset when it is not set.
 */
const inset = 'var(--shell-inset, 8px)';
const under = `var(--shell-gap, ${inset})`;

export const header = style({
  position: 'relative',
  // Under the popovers and dialogs of the kit, over the layout's islands.
  zIndex: 30,
  display: 'flex',
  flex: 'none',
  alignItems: 'center',
  gap: themeVars.spacing['3'],
  boxSizing: 'border-box',
  minHeight: `calc(36px + ${inset} + ${under})`,
  padding: `${inset} ${inset} ${under}`,
  color: c.panel.textColor,
  '@media': {
    'screen and (max-width: 768px)': {
      minHeight: `calc(36px + ${inset} + ${under} + env(safe-area-inset-top, 0px))`,
      paddingTop: `calc(${inset} + env(safe-area-inset-top, 0px))`,
    },
  },
});

export const brand = style({display: 'flex', alignItems: 'center'});

// Centred on the header, as today, whatever sits left and right of it.
export const title = style({
  position: 'absolute',
  inset: `${inset} 0 ${under}`,
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
