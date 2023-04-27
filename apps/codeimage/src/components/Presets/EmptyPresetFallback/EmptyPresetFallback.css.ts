import {themeVars, withThemeMode} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

export const fallbackContainer = style({
  minHeight: 0,
  flex: 1,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  color: themeVars.dynamicColors.descriptionTextColor,
  textAlign: 'center',
  borderRadius: themeVars.borderRadius.lg,
  selectors: {
    ...withThemeMode({
      light: {
        backgroundColor: themeVars.backgroundColor.gray['200'],
        color: themeVars.dynamicColors.descriptionTextColor,
      },
      dark: {
        backgroundColor: darkGrayScale.gray3,
        color: themeVars.dynamicColors.descriptionTextColor,
      },
    }),
  },
});
