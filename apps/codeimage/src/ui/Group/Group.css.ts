import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import {style} from '@vanilla-extract/css';

export const base = style({
  display: 'inline-flex',
  flex: 1,
});

export const group = recipe({
  base: base,

  variants: {
    orientation: {
      horizontal: {
        flexDirection: 'row',
      },
      vertical: {
        flexDirection: 'column',
      },
    },
  },
});

export type GroupVariants = RecipeVariants<typeof group>;
