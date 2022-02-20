import {style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';

import * as fieldStyles from '../TextField/TextField.css';

export const colorPicker = style([
  fieldStyles.baseField,
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
