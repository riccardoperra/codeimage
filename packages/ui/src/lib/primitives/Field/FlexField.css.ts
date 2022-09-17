import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import {createVar} from '@vanilla-extract/css';
import {themeVars} from '../../theme';
import * as variables from '../../theme/variables.css';

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
      [variables.fontSize]: themeVars.fontSize.base,
    },
  },
  variants: {
    size: {
      xs: {
        vars: {
          [inputHeight]: '24px',
          [variables.fontSize]: themeVars.fontSize.xs,
        },
      },
      md: {
        vars: {
          [inputHeight]: '32px',
          [variables.fontSize]: themeVars.fontSize.sm,
        },
      },
      lg: {
        vars: {
          [inputHeight]: '42px',
          [variables.fontSize]: themeVars.fontSize.base,
        },
      },
    },
  },
});

export type FlexFieldVariants = RecipeVariants<typeof wrapper>;
