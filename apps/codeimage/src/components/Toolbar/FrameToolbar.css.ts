import {themeVars, withThemeMode} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

export const frameToolbar = style({
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '10px',
  borderRadius: themeVars.borderRadius.xl,
  height: '50px',
  selectors: {
    ...withThemeMode({
      dark: {
        background: `${darkGrayScale.gray1}`,
        boxShadow: themeVars.boxShadow.md,
      },
      light: {
        background: themeVars.backgroundColor.white,
        boxShadow: themeVars.boxShadow.lg,
      },
    }),
  },
  position: 'fixed',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: themeVars.zIndex['40'],
});
