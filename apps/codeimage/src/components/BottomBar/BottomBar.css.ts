import {style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';
import {scaffoldVars} from '../Scaffold/Scaffold.css';

export const wrapper = style({
  height: `calc(${scaffoldVars.toolbarHeight} + env(safe-area-inset-bottom, 20px))`,
  width: '100vw',
  overflow: 'hidden',
  borderTop: `1px solid ${themeVars.dynamicColors.divider}`,
  backgroundColor: themeVars.dynamicColors.bottomBarBackgroundColor,
  color: themeVars.dynamicColors.bottomBarTextColor,
  display: 'grid',
  alignItems: 'center',
  padding: `0 ${themeVars.spacing['4']}`,
  paddingBottom: `env(safe-area-inset-bottom, 20px)`,
  gridTemplateColumns: `1fr 1fr`,
  gap: themeVars.spacing['4'],
});

export const button = style([
  {
    display: 'flex',
    flexDirection: 'column',
    color: themeVars.dynamicColors.bottomBarTextColor,
  },
]);

export const portalWrapper = style({
  position: 'fixed',
  bottom: `calc(${scaffoldVars.toolbarHeight} + env(safe-area-inset-bottom, 20px))`,
  backgroundColor: themeVars.dynamicColors.panelBackground,
  color: themeVars.dynamicColors.panelTextColor,
  width: '100%',
  borderTop: `1px solid ${themeVars.dynamicColors.divider}`,
});

export const portalHeader = style({
  flex: 1,
  display: 'flex',
  padding: themeVars.spacing['3'],
  paddingBottom: 0,
});

export const portalContent = style({
  overflowY: 'auto',
  flex: 0,
  maxHeight: '50vh',
});
