import {recipe, RecipeVariants} from '@vanilla-extract/recipes';

export const svgIcon = recipe({
  base: {
    width: '20px',
    height: '20px',
  },

  variants: {
    size: {
      md: {
        height: '20px',
        width: '20px',
      },
      sm: {
        width: '16px',
        height: '16px',
      },
      xs: {
        width: '14px',
        height: '14px',
      },
    },
  },
});

export type SvgIconProps = RecipeVariants<typeof svgIcon>;
