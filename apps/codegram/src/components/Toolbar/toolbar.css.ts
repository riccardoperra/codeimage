import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';

export const [toolbarTheme, toolbarVars] = createTheme({
  backgroundColor: themeVars.backgroundColor.gray['200'],
});

export const wrapper = style([
  toolbarTheme,
  {
    position: 'fixed',
    backgroundColor: toolbarVars.backgroundColor,
    padding: '12px 18px',
    display: 'flex',
    alignItems: 'center',
    width: '700px',
    color: themeVars.textColor.blue['900'],
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 30,
    top: 25,
    borderRadius: themeVars.borderRadius.lg,
  },
]);
