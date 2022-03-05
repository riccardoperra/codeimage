import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';

export const [toolbarTheme, toolbarVars] = createTheme({
  backgroundColor: themeVars.backgroundColor.white,
});

export const wrapper = style([
  toolbarTheme,
  {
    padding: '0px 18px',
    display: 'flex',
    alignItems: 'center',
    color: themeVars.textColor.blue['900'],
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 30,
    height: '60px',
    width: '100%',
    backgroundColor: themeVars.dynamicColors.panelBackground,
    borderBottom: `1px solid ${themeVars.dynamicColors.divider}`,
  },
]);

export const title = style({});

export const actionBox = style({
  display: 'flex',
  flexWrap: 'nowrap',
  flexDirection: 'row',
  flex: '1',
  alignItems: 'center',
  columnGap: themeVars.spacing['3'],
});
