import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
import {checkerboard} from '../Frame/FrameHandler.css';

export const canvas = style({
  position: 'relative',
  display: 'flex',
  flex: 1,
  minWidth: 0,
  minHeight: 0,
});

export const layers = style({
  position: 'relative',
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

export const pill = style({
  position: 'absolute',
  top: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 2,
  border: 0,
  borderRadius: themeVars.borderRadius.xl,
  padding: '10px 16px',
  background: themeVars.backgroundColor.gray['800'],
  color: themeVars.backgroundColor.white,
  fontFamily: 'inherit',
  fontSize: 13,
  width: 'max-content',
  maxWidth: 'calc(100% - 24px)',
  whiteSpace: 'normal',
  textAlign: 'center',
  cursor: 'pointer',
});
