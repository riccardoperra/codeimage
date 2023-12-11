import {themeTokens, themeVars} from '@codeui/kit';
import {style} from '@vanilla-extract/css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';

export const alert = recipe({
  base: {
    padding: `${themeTokens.spacing['4']} ${themeTokens.spacing['5']}`,
    borderRadius: themeTokens.radii.md,
    fontSize: themeTokens.fontSize.md,
    display: 'inline-flex',
    alignItems: 'center',
  },
  variants: {
    fluid: {
      true: {
        width: '100%',
      },
    },
    theme: {
      info: {
        backgroundColor: themeVars.brandSoft,
        color: themeVars.brandLink,
      },
      warning: {
        backgroundColor: themeVars.caution,
        color: '#fff',
      },
      critical: {
        backgroundColor: themeVars.critical,
        color: '#fff',
      },
    },
  },
});

export const alertIcon = style({
  marginRight: themeTokens.spacing['2'],
  alignSelf: 'flex-start',
  lineHeight: 1,
});

export type AlertVariants = RecipeVariants<typeof alert>;
