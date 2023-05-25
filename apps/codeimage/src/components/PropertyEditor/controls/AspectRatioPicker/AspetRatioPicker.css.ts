import {textFieldStyles, themeVars, withThemeMode} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {createVar, style} from '@vanilla-extract/css';

export const input = style([
  textFieldStyles.baseField,
  {
    padding: themeVars.spacing['1'],
    paddingLeft: themeVars.spacing['3'],
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: themeVars.spacing['3'],
  },
]);

export const aspectRatioPopover = style({
  width: '360px',
  maxWidth: 'unset',
});

export const aspectRatio = createVar();

export const aspectRatioPreviewBox = style({
  height: '100%',
  width: 'auto',
  borderRadius: themeVars.borderRadius.sm,
  aspectRatio: aspectRatio,
  selectors: {
    ...withThemeMode({
      dark: {
        border: `2px solid ${darkGrayScale.gray7}`,
        background: darkGrayScale.gray3,
      },
      light: {
        border: `2px solid ${themeVars.borderColor.default}`,
        background: 'white',
      },
    }),
  },
});

export const aspectRatioCard = style([
  {
    flex: '1 0 33%',
    borderRadius: themeVars.borderRadius.xl,
    padding: themeVars.spacing['5'],
    color: themeVars.dynamicColors.baseText,
    transition: 'background-color 0.2s ease-in-out',
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    flexDirection: 'column',
    userSelect: 'none',
    selectors: {
      ...withThemeMode({
        dark: {
          border: `1px solid ${darkGrayScale.gray7}`,
        },
        light: {
          border: `1px solid ${themeVars.borderColor.default}`,
        },
      }),

      ...withThemeMode(
        {
          dark: {backgroundColor: darkGrayScale.gray2},
          light: {backgroundColor: darkGrayScale.gray12},
        },
        '&:hover',
      ),

      ...withThemeMode(
        {
          dark: {
            backgroundColor: darkGrayScale.gray2,
            border: `1px solid ${themeVars.dynamicColors.primary}`,
          },
          light: {
            backgroundColor: 'white',
            border: `1px solid ${themeVars.dynamicColors.primary}`,
          },
        },
        '&[data-selected]',
      ),

      '&:not([data-selected])': {
        border: 'unset',
      },
    },
  },
]);

export const aspectRatioCardFull = style([
  aspectRatioCard,
  {
    flex: '1 0 100%',
  },
]);

export const aspectRadioCardPreview = style({
  aspectRatio: aspectRatio,
  width: '100%',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.borderRadius.md,
  selectors: {
    ...withThemeMode({
      dark: {
        border: `1px solid ${darkGrayScale.gray7}`,
      },
      light: {
        border: `1px solid ${themeVars.borderColor.default}`,
        boxShadow: themeVars.boxShadow.default,
      },
    }),
  },
});

export const aspectRatioCardList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1px',
});
