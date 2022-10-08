import {backgroundColorVar, themeVars, withThemeMode} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';

export const item = style([
  {
    backgroundColor: themeVars.dynamicColors.input.backgroundColor,
    width: '100%',
    borderRadius: themeVars.borderRadius.md,
    padding: '24px',
    paddingBottom: '12px',
    height: '128px',
    boxShadow: themeVars.boxShadow.md,
    color: themeVars.dynamicColors.baseText,
    transition: 'background-color 0.2s ease-in-out',
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    selectors: {
      ...withThemeMode({
        dark: {backgroundColor: themeVars.dynamicColors.input.backgroundColor},
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

export const projectInfo = style({
  fontWeight: 300,
  color: themeVars.dynamicColors.descriptionTextColor,
  marginTop: 'auto',
});

export const projectLanguages = style({
  color: themeVars.dynamicColors.descriptionTextColor,
  display: 'flex',
  flexWrap: 'wrap',
  marginTop: themeVars.spacing['2'],
  gap: themeVars.spacing['2'],
});

export const itemLink = style({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  outline: 'none',
});

export const itemTitle = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  vars: {
    ['--highlight-color']: 'rgb(112, 182, 246, 0.25)',
  },
});

export const languageBadge = style({
  backgroundColor: backgroundColorVar,
  borderRadius: themeVars.borderRadius.lg,
  height: '12px',
  width: '12px',
});
