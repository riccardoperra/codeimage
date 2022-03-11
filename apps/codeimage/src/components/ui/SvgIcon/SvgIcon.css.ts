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
        width: '15px',
        height: '15px',
      },
    },
  },
});

export type SvgIconProps = RecipeVariants<typeof svgIcon>;
