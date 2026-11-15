import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
import {checkerboard} from '../Frame/FrameHandler.css';

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

// A transparent or translucent frame shows the squares the editor shows
// behind it, and nothing paints outside it.
globalStyle(`${stage} [data-animation-frame]`, checkerboard);
