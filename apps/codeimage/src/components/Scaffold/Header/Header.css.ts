import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '@codeimage/ui';
import {scaffoldVars} from '../Scaffold.css';

export const [headerTheme, headerVars] = createTheme({
  height: scaffoldVars.toolbarHeight,
});

export const header = style([
  headerTheme,
  {
    height: headerVars.height,
    width: '100%',
    backgroundColor: themeVars.backgroundColor.white,
    borderBottom: `1px solid ${themeVars.dynamicColors.divider}`,
    zIndex: '10',
  },
]);

export const content = style({
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  padding: `0 ${themeVars.spacing['4']}`,
});
