import {style} from '@vanilla-extract/css';
import {baseField} from '../TextField/TextField.css';
import {themeVars} from '../../theme';

export const colorPicker = style([
  baseField,
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
