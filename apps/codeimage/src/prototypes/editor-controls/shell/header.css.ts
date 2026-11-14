import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;

/*
 * No bar of its own: the logo and the actions sit on the app background,
 * above the islands, 44px tall where today's toolbar is 52px.
 */
export const header = style({
  position: 'relative',
  // Under the popovers and dialogs of the kit, over the layout's islands.
  zIndex: 30,
  display: 'flex',
  flex: 'none',
  alignItems: 'center',
  gap: themeVars.spacing['3'],
  boxSizing: 'border-box',
  height: '44px',
  padding: `0 ${themeVars.spacing['3']} 0 ${themeVars.spacing['4']}`,
  color: c.panel.textColor,
  '@media': {
    'screen and (max-width: 768px)': {
      height: 'calc(44px + env(safe-area-inset-top, 0px))',
      paddingTop: 'env(safe-area-inset-top, 0px)',
    },
  },
});

export const brand = style({display: 'flex', alignItems: 'center'});

// Centred on the header, as today, whatever sits left and right of it.
export const title = style({
  position: 'absolute',
  inset: 0,
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
