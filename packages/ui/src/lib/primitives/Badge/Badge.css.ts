import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import {themeVars} from '../../theme';
import * as textStyles from '../Text/Text.css';
import {fontSize} from '../Text/Text.css';

export const badge = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: themeVars.borderRadius.lg,
  },
  variants: {
    variant: {
      rounded: {
        borderRadius: '50%',
      },
      square: {
        borderRadius: themeVars.borderRadius.lg,
      },
    },
    size: {
      md: [
        textStyles.fontSize.base,
        {
          width: '36px',
          height: '36px',
          fontSize: fontSize.base,
        },
      ],
      sm: [
        textStyles.fontSize.sm,
        {
          width: '28px',
          height: '28px',
        },
      ],
      xs: [
        textStyles.fontSize.xs,
        {
          width: '24px',
          height: '24px',
        },
      ],
    },
  },
});

export type BadgeVariants = RecipeVariants<typeof badge>;
