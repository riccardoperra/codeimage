import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';

export const [textFieldTheme, textFieldVars] = createTheme({
  borderColor: themeVars.borderColor.default,
  background: themeVars.backgroundColor.white,
  color: themeVars.textColor.gray['900'],
});

export const baseField = style([
  textFieldTheme,
  {
    appearance: 'none',
    border: `1px solid ${textFieldVars.borderColor}`,
    backgroundColor: textFieldVars.background,
    borderRadius: themeVars.borderRadius.md,
    ':focus': {
      borderColor: themeVars.backgroundColor.blue['500'],
    },
  },
]);

export const textField = style([
  baseField,
  {
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: themeVars.spacing['2'],
  },
]);

export const unstyledTextField = style([
  {
    border: 0,
    borderRadius: 0,
    padding: 0,
    margin: 0,
    background: 'transparent',
    ':focus': {
      outline: 'none',
    },
  },
]);
