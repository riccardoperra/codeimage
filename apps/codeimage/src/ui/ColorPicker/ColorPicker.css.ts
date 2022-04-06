import {style} from '@vanilla-extract/css';
import {textFieldStyles, themeVars} from '@codeimage/ui';

export const colorPicker = style([
  textFieldStyles,
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
