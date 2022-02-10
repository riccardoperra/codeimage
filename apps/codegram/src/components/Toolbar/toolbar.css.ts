import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';

export const [toolbarTheme, toolbarVars] = createTheme({
  backgroundColor: themeVars.backgroundColor.white,
});

export const wrapper = style([
  toolbarTheme,
  {
    position: 'absolute',
    backgroundColor: toolbarVars.backgroundColor,
    padding: '0px 18px',
    display: 'flex',
    alignItems: 'center',
    minWidth: '750px',
    color: themeVars.textColor.blue['900'],
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 30,
    left: '50%',
    transform: 'translateX(-50%)',
    top: 48,
    height: '60px',
    boxShadow: themeVars.boxShadow.md,
    // border: `1px solid ${themeVars.borderColor.default}`,
    borderRadius: themeVars.borderRadius.lg,
  },
]);
