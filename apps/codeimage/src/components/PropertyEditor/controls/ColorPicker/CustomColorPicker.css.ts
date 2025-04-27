import {
  backgroundColorVar,
  textFieldStyles,
  themeVars,
  withThemeMode,
} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {responsiveStyle} from '@codeui/kit';
import {style} from '@vanilla-extract/css';
import {recipe, type RecipeVariants} from '@vanilla-extract/recipes';

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

export const popover = style([
  {
    maxWidth: '360px',
    width: '100%',
    transition: `all 250ms ease-in-out`,
    selectors: {
      ...withThemeMode({
        dark: {
          background: darkGrayScale.gray1,
        },
        light: {
          background: darkGrayScale.white,
        },
      }),
    },
  },
  responsiveStyle({
    md: {
      maxWidth: 'initial',
    },
  }),
]);

export type ColorPickerColorItemProps = RecipeVariants<typeof colorItem>;
