import {fallbackVar} from '@vanilla-extract/css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import * as variables from '../../theme/variables.css';

export const svgIcon = recipe({
  base: {
    width: fallbackVar(variables.fontSize, '20px'),
    height: fallbackVar(variables.fontSize, '20px'),
  },

  variants: {
    size: {
      '3x': {
        width: '128px',
        height: '128px',
      },
      lg: {
        height: '26px',
        width: '26px',
      },
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
