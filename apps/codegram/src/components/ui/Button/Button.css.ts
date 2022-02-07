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
    height: '40px',
    padding: '0 16px',
    margin: 0,
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: themeVars.fontSize.base,
    fontWeight: themeVars.fontWeight.medium,
    lineHeight: 1,
    fontFamily: 'inherit',
    outline: 'none',
    placeContent: 'center',
    placeItems: 'center',
    transition: 'opacity .2s, background-color .2s, box-shadow .2s',
    backgroundColor: backgroundColorVar,
    color: colorVar,

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
    },
    // Button theme
    theme: {
      primary: {
        vars: {
          [backgroundColorVar]: themeVars.backgroundColor.indigo['500'],
          [colorVar]: themeVars.textColor.white,
        },
        selectors: {
          '&:hover:not(:disabled)': {
            vars: {
              [backgroundColorVar]: themeVars.backgroundColor.indigo['700'],
            },
          },
        },
      },
      secondary: {
        vars: {
          [backgroundColorVar]: themeVars.backgroundColor.gray['300'],
          [colorVar]: themeVars.textColor.gray['700'],
        },
        selectors: {
          '&:hover:not(:disabled)': {
            vars: {
              [backgroundColorVar]: themeVars.backgroundColor.gray['400'],
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
