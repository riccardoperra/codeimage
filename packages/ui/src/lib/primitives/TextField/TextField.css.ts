import {createTheme, fallbackVar, style} from '@vanilla-extract/css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import {themeVars} from '../../theme';
import * as variables from '../../theme/variables.css';
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
    fontSize: variables.fontSize,
    height: fallbackVar(textFieldVars.inputHeight, '100%'),
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

export const textField = recipe({
  base: [
    baseField,
    {
      paddingRight: themeVars.spacing['3'],
      paddingTop: 0,
      paddingBottom: themeVars.spacing.px,
      paddingLeft: themeVars.spacing['3'],
    },
  ],
  variants: {
    inline: {
      true: {
        backgroundColor: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${textFieldVars.background}`,
        borderRadius: 0,
        paddingLeft: 0,
        paddingRight: 0,
      },
    },
    withLeftIcon: {
      true: {
        paddingLeft: themeVars.spacing['6'],
      },
    },
  },
});

export type TextFieldProps = RecipeVariants<typeof textField>;
