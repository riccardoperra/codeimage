import {style} from '@vanilla-extract/css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import * as textFieldTheme from '../TextField/TextField.css';
import {themeVars} from '@codeimage/ui';
import * as groupStyles from '../Group/Group.css';

export const radioBlock = recipe({
  base: style([
    textFieldTheme.baseField,
    {
      transition: 'border .2s, color .2s',
      selectors: {
        [`${groupStyles.base}:nth-child(n) &`]: {
          borderRadius: 0,
        },
        [`${groupStyles.base}[data-orientation="vertical"] &:first-child`]: {
          borderTopLeftRadius: themeVars.borderRadius.md,
          borderTopRightRadius: themeVars.borderRadius.md,
        },
        [`${groupStyles.base}[data-orientation="vertical"] &:last-child`]: {
          borderBottomLeftRadius: themeVars.borderRadius.md,
          borderBottomRightRadius: themeVars.borderRadius.md,
        },
      },
    },
  ]),
  variants: {
    selected: {
      true: {
        borderColor: themeVars.backgroundColor.blue['500'],
      },
    },
  },
});

export type RadioBlockVariants = RecipeVariants<typeof radioBlock>;
