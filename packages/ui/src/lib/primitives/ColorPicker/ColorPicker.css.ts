import {style} from '@vanilla-extract/css';
import {textFieldStyles} from '../TextField';
import {themeVars} from '../../theme';

export const colorPicker = style([
  textFieldStyles.baseField,
  {
    flex: 1,
  },
  {
    appearance: 'none',

    selectors: {
      '&::-webkit-color-swatch-wrapper': {},
      '&::-webkit-color-swatch': {
        border: 0,
        borderRadius: themeVars.borderRadius.md,
      },
    },
  },
]);
