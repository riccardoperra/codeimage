import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import {createVar} from '@vanilla-extract/css';

export const inputHeight = createVar();

export const wrapper = recipe({
  base: {
    height: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    vars: {
      [inputHeight]: '100%',
    },
  },
  variants: {
    size: {
      xs: {
        vars: {
          [inputHeight]: '24px',
        },
      },
      md: {
        vars: {
          [inputHeight]: '32px',
        },
      },
      lg: {
        vars: {
          [inputHeight]: '42px',
        },
      },
    },
  },
});

export type FlexFieldVariants = RecipeVariants<typeof wrapper>;
