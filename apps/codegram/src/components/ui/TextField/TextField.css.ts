import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';
import {fontSize} from '../Text/Text.css';

export const [textFieldTheme, textFieldVars] = createTheme({
  borderColor: themeVars.borderColor.default,
  background: themeVars.backgroundColor.white,
  color: themeVars.textColor.gray['900'],
});

export const wrapper = style([
  textFieldTheme,
  {
    position: 'relative',
    display: 'flex',
    width: 'auto',
    alignItems: 'center',
    border: `1px solid ${textFieldVars.borderColor}`,
    backgroundColor: textFieldVars.background,
    borderRadius: themeVars.borderRadius.md,
  },
]);

export const textField = style([
  fontSize.xs,
  {
    selectors: {
      [`${textFieldTheme} &`]: {
        width: '1px',
        flexGrow: '1',
        border: 'none',
        background: 'none',
      },
    },
    paddingRight: 0,
    borderRadius: themeVars.borderRadius.md,
    paddingTop: 0,
    paddingBottom: 0,
  },
]);
