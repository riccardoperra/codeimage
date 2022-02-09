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
    position: 'fixed',
    top: sidebarVars.topOffset,
    right: 0,
    height: '100%',
    borderLeft: `1px solid ${themeVars.borderColor.default}`,
    width: sidebarVars.width,
    backgroundColor: themeVars.backgroundColor.white,
    zIndex: 0,
  },
]);
