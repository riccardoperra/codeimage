import {themeVars, withThemeMode} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

// Takes a row of its own on a phone, where the buttons fill the first one.
export const track = style({
  position: 'relative',
  flex: 1,
  minWidth: 0,
  '@media': {
    'screen and (max-width: 768px)': {
      flexBasis: '100%',
      order: 1,
    },
  },
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  touchAction: 'none',
  outline: 'none',
  borderRadius: themeVars.borderRadius.md,
  selectors: {
    '&:focus-visible': {
      boxShadow: `0 0 0 2px ${themeVars.dynamicColors.primary}`,
    },
  },
});

export const bar = style({
  display: 'flex',
  width: '100%',
  height: '8px',
  borderRadius: '4px',
  overflow: 'hidden',
});

export const hold = style({
  height: '100%',
  selectors: withThemeMode({
    dark: {background: darkGrayScale.gray7},
    light: {background: themeVars.backgroundColor.gray['400']},
  }),
});

export const transition = style({
  height: '100%',
  opacity: 0.6,
  backgroundImage: `repeating-linear-gradient(-45deg, ${themeVars.dynamicColors.primary} 0 3px, transparent 3px 6px)`,
});

export const thumb = style({
  position: 'absolute',
  top: '50%',
  width: '4px',
  height: '24px',
  borderRadius: '2px',
  transform: 'translate(-50%, -50%)',
  background: themeVars.dynamicColors.primary,
  pointerEvents: 'none',
});
