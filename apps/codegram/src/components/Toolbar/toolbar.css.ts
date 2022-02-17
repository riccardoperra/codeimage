import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';

export const [toolbarTheme, toolbarVars] = createTheme({
  backgroundColor: themeVars.backgroundColor.white,
});

export const wrapper = style([
  toolbarTheme,
  {
    position: 'absolute',
    padding: '0px 18px',
    display: 'flex',
    alignItems: 'center',
    color: themeVars.textColor.blue['900'],
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 30,
    top: 0,
    right: 0,
    height: '60px',
  },
]);
