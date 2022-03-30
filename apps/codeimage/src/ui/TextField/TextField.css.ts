import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';
import {inputHeight} from '../Field/FlexField.css';

export const [textFieldTheme, textFieldVars] = createTheme({
  borderColor: themeVars.dynamicColors.input.borderColor,
  background: themeVars.dynamicColors.input.backgroundColor,
  color: themeVars.dynamicColors.input.textColor,
  inputHeight: inputHeight,
});

export const baseField = style([
  textFieldTheme,
  {
    appearance: 'none',
    border: `1px solid ${textFieldVars.borderColor}`,
    backgroundColor: textFieldVars.background,
    borderRadius: themeVars.borderRadius.md,
    width: '100%',
    height: textFieldVars.inputHeight,
    color: 'currentcolor',
    ':focus': {
      borderColor: themeVars.backgroundColor.blue['500'],
    },
    ':focus-visible': {
      outline: 'none',
      borderColor: themeVars.backgroundColor.blue['500'],
    },
  },
]);

export const textField = style([
  baseField,
  {
    paddingRight: themeVars.spacing['3'],
    paddingTop: 0,
    paddingBottom: themeVars.spacing.px,
    paddingLeft: themeVars.spacing['3'],
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
