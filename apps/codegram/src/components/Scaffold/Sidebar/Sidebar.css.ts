import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';
import {scaffoldVars} from '../Scaffold.css';

export const [sidebarTheme, sidebarVars] = createTheme({
  width: scaffoldVars.panelWidth,
  topOffset: scaffoldVars.toolbarHeight,
});

export const sidebar = style([
  sidebarTheme,
  {
    height: '100%',
    borderRight: `1px solid ${themeVars.dynamicColors.divider}`,
    borderLeft: `1px solid ${themeVars.dynamicColors.divider}`,
    flex: `0 0 ${sidebarVars.width}`,
    backgroundColor: themeVars.dynamicColors.panelBackground,
    zIndex: 0,
    transition: 'background-color .2s, border .2s',
  },
]);
