import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const stage = style({
  position: 'relative',
  borderRadius: themeVars.borderRadius.lg,
  outline: 'none',
  selectors: {
    '&:focus-visible': {
      boxShadow: `0 0 0 2px ${themeVars.dynamicColors.primary}`,
    },
  },
});
