import {themeVars, withThemeMode} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

export const banner = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.spacing['3'],
  padding: `${themeVars.spacing['2']} ${themeVars.spacing['5']}`,
  selectors: {
    ...withThemeMode({
      light: {
        background: themeVars.backgroundColor.gray['200'],
        color: themeVars.backgroundColor.gray['900'],
      },
      dark: {
        background: darkGrayScale.gray5,
        color: darkGrayScale.gray12,
      },
    }),
  },
  '@media': {
    '(min-width: 768px)': {
      flexDirection: 'row',
      alignItems: 'center',
    },
  },
});
