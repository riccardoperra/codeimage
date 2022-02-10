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
    borderRight: `1px solid ${themeVars.borderColor.default}`,
    flex: `0 0 ${sidebarVars.width}`,
    backgroundColor: themeVars.backgroundColor.white,
    zIndex: 0,
  },
]);
