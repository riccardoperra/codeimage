import {style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';
import {scaffoldVars} from '../Scaffold/Scaffold.css';

export const wrapper = style({
  height: `calc(${scaffoldVars.toolbarHeight} + env(safe-area-inset-bottom, 0))`,
  width: '100vw',
  overflow: 'hidden',
  borderTop: `1px solid ${themeVars.dynamicColors.divider}`,
  backgroundColor: `#2B2B2B`,
  color: themeVars.dynamicColors.panelTextColor,
  display: 'grid',
  alignItems: 'center',
  padding: `0 ${themeVars.spacing['4']}`,
  paddingBottom: `env(safe-area-inset-bottom)`,
  gridTemplateColumns: `1fr 1fr 1fr`,
  gap: themeVars.spacing['4'],
});

export const button = style([
  {
    display: 'flex',
    flexDirection: 'column',
  },
]);

export const portalContent = style({
  position: 'fixed',
  bottom: `calc(${scaffoldVars.toolbarHeight} + env(safe-area-inset-bottom, 0))`,
  backgroundColor: themeVars.dynamicColors.panelBackground,
  color: themeVars.dynamicColors.panelTextColor,
  borderTop: `1px solid ${themeVars.dynamicColors.divider}`,
});
