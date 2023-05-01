import {themeVars, withThemeMode} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {themeTokens} from '@codeui/kit';
import {style} from '@vanilla-extract/css';

export const imageGrid = style([
  {
    display: 'grid',
    padding: themeTokens.spacing['2'],
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: themeVars.spacing[3],
    overflow: 'auto',
    maxHeight: '400px',
    width: '240px',
    '@media': {
      '(min-width: 640px)': {
        width: '544px',
        gridTemplateColumns: 'repeat(3, 1fr)',
      },
    },
  },
]);

export const imagesCard = style([
  {
    backgroundColor: themeVars.dynamicColors.input.backgroundColor,
    width: '100%',
    borderRadius: themeTokens.radii.xl,
    padding: themeTokens.spacing['3'],
    paddingBottom: themeTokens.spacing['2'],
    boxShadow: themeTokens.boxShadow.md,
    color: themeVars.dynamicColors.baseText,
    transition: 'background-color 0.2s ease-in-out',
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    selectors: {
      '&[data-active]': {
        outline: `2px solid ${themeVars.dynamicColors.primary}`,
        outlineOffset: '2px',
      },
      ...withThemeMode({
        dark: {
          backgroundColor: themeVars.dynamicColors.input.backgroundColor,
          border: `1px solid ${darkGrayScale.gray7}`,
        },
        light: {
          backgroundColor: themeVars.backgroundColor.white,
          border: `1px solid ${themeVars.borderColor.default}`,
          boxShadow: themeTokens.boxShadow.default,
        },
      }),

      ...withThemeMode(
        {
          dark: {backgroundColor: darkGrayScale.gray2},
          light: {backgroundColor: darkGrayScale.gray12},
        },
        '&[data-ready]:hover',
      ),
    },
  },
]);

export const textFieldImageUrl = style({
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
  flex: 1,
});

export const textFieldImageInput = style({
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
});

export const confirmButton = style({
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
});

export const assetImagePreview = style([
  {
    borderRadius: themeTokens.radii.sm,
  },
]);
