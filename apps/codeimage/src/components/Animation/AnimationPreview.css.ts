import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const layers = style({
  display: 'grid',
  placeItems: 'center',
});

export const layer = style({
  gridArea: '1 / 1',
  display: 'grid',
  placeItems: 'center',
});

export const stage = style({
  gridArea: '1 / 1',
  position: 'relative',
  borderRadius: themeVars.borderRadius.lg,
  outline: 'none',
  selectors: {
    '&:focus-visible': {
      boxShadow: `0 0 0 2px ${themeVars.dynamicColors.primary}`,
    },
  },
});
