import {themeVars, withThemeMode} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';

export const item = style([
  {
    backgroundColor: themeVars.dynamicColors.input.backgroundColor,
    width: '100%',
    borderRadius: themeVars.borderRadius.md,
    padding: themeVars.spacing['3'],
    boxShadow: themeVars.boxShadow.md,
    color: themeVars.dynamicColors.baseText,
    transition: 'background-color 0.2s ease-in-out',
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    selectors: {
      ...withThemeMode({
        dark: {
          backgroundColor: themeVars.dynamicColors.input.backgroundColor,
          border: `1px solid ${darkGrayScale.gray7}`,
        },
        light: {
          backgroundColor: themeVars.backgroundColor.white,
          border: `1px solid ${themeVars.borderColor.default}`,
          boxShadow: themeVars.boxShadow.default,
        },
      }),

      ...withThemeMode(
        {
          dark: {backgroundColor: darkGrayScale.gray2},
          light: {backgroundColor: darkGrayScale.gray12},
        },
        '&:hover',
      ),
    },
  },
]);
