import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';
import {backgroundColorVar, colorVar} from '../../../theme/variables.css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';

export const [] = createTheme({});

export const button = style([
  {
    position: 'relative',
    display: 'inline-flex',
    overflow: 'hidden',
    height: '36px',
    padding: `0 ${themeVars.spacing['3']}`,
    borderRadius: themeVars.borderRadius.lg,
    cursor: 'pointer',
    fontSize: themeVars.fontSize.sm,
    fontWeight: themeVars.fontWeight.medium,
    lineHeight: 1,
    fontFamily: 'inherit',
    outline: 'none',
    placeContent: 'center',
    placeItems: 'center',
    transition: 'opacity .2s, background-color .2s, box-shadow .2s',
    backgroundColor: backgroundColorVar,
    color: colorVar,
    userSelect: 'none',

    ':disabled': {
      cursor: 'default',
      opacity: 0.5,
    },

    ':focus': {
      boxShadow: themeVars.boxShadow.outline,
    },
  },
]);

export const buttonVariant = recipe({
  base: [button],
  variants: {
    // Button type
    variant: {
      solid: {
        backgroundColor: backgroundColorVar,
        border: 'none',
      },
      outline: {
        backgroundColor: 'transparent',
        color: backgroundColorVar,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'currentColor',

        ':hover': {
          backgroundColor: backgroundColorVar,
          color: colorVar,
        },
      },
      link: {
        border: 'none',
        backgroundColor: 'transparent',
        color: colorVar,

        ':hover': {
          color: backgroundColorVar,
        },
      },
    },
    // Button theme
    theme: {
      primary: {
        vars: {
          [backgroundColorVar]:
            themeVars.dynamicColors.buttonBackgroundPrimaryColor,
          [colorVar]: themeVars.dynamicColors.buttonTextPrimaryColor,
        },
        selectors: {
          '&:hover:not(:disabled)': {
            vars: {
              [backgroundColorVar]:
                themeVars.dynamicColors.buttonBackgroundPrimaryHover,
            },
          },
        },
      },
      secondary: {
        vars: {
          [backgroundColorVar]: themeVars.dynamicColors.buttonBackgroundColor,
          [colorVar]: themeVars.dynamicColors.buttonTextColor,
        },
        selectors: {
          '&:hover:not(:disabled)': {
            vars: {
              [backgroundColorVar]:
                themeVars.dynamicColors.buttonBackgroundHover,
            },
          },
        },
      },
    },
  },
  defaultVariants: {
    variant: 'outline',
    theme: 'primary',
  },
});

export type ButtonVariants = RecipeVariants<typeof buttonVariant>;
