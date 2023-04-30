import {
  backgroundColorVar,
  textFieldStyles,
  themeVars,
  withThemeMode,
} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';

export const inputColor = style({
  borderRadius: themeVars.borderRadius.md,
  width: themeVars.width.full,
  height: '100%',
  background: backgroundColorVar,
  backgroundSize: 'contain',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: '50% 50%',
});

export const input = style([
  textFieldStyles.baseField,
  {
    padding: themeVars.spacing['1'],
    flex: 1,
  },
]);

export const wrapper = style({
  display: 'flex',
  width: '100%',
});

export const colorGrid = style({
  display: 'grid',
  gap: themeVars.spacing['3'],
  gridTemplateColumns: 'repeat(6, 1fr)',
});

export const colorItem = recipe({
  base: {
    borderRadius: themeVars.borderRadius.full,
    cursor: 'pointer',
    width: '28px',
    height: '28px',
    background: backgroundColorVar,
    boxShadow: themeVars.boxShadow.md,
  },
  variants: {
    active: {
      true: {
        boxShadow: themeVars.boxShadow.outline,
      },
    },
  },
});

export const popover = style({
  maxWidth: 'initial',
  transition: `all 250ms ease-in-out`,
});

export const imageGrid = style([
  {
    display: 'grid',
    padding: themeVars.spacing['2'],
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
    borderRadius: themeVars.borderRadius.xl,
    padding: themeVars.spacing['5'],
    paddingBottom: themeVars.spacing['2'],
    boxShadow: themeVars.boxShadow.md,
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

export type ColorPickerColorItemProps = RecipeVariants<typeof colorItem>;
