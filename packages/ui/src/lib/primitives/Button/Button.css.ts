import {style} from '@vanilla-extract/css';
import {backgroundColorVar, colorVar} from '../../theme/variables.css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import {themeVars} from '../../theme';

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
      opacity: 0.3,
    },

    ':focus': {
      boxShadow: themeVars.boxShadow.outline,
    },
  },
]);

export const buttonVariant = recipe({
  base: [button],
  variants: {
    block: {
      true: {
        width: '100%',
        flex: 1,
      },
    },
    pill: {
      true: {
        borderRadius: themeVars.borderRadius.full,
      },
    },
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

        selectors: {
          '&:not(:disabled):hover': {
            color: backgroundColorVar,
          },
        },
      },
    },
    // Button theme
    theme: {
      primary: {
        vars: {
          [backgroundColorVar]:
            themeVars.dynamicColors.button.primary.backgroundColor,
          [colorVar]: themeVars.dynamicColors.button.primary.textColor,
        },
        selectors: {
          '&:not(:disabled):hover': {
            vars: {
              [backgroundColorVar]:
                themeVars.dynamicColors.button.primary.hoverColor,
            },
          },
        },
      },
      secondary: {
        vars: {
          [backgroundColorVar]:
            themeVars.dynamicColors.button.base.backgroundColor,
          [colorVar]: themeVars.dynamicColors.button.base.textColor,
        },
        selectors: {
          '&:hover:not(:disabled)': {
            vars: {
              [backgroundColorVar]:
                themeVars.dynamicColors.button.base.hoverColor,
            },
          },
        },
      },
    },

    size: {
      md: {
        height: '42px',
        minWidth: '72px',
        fontSize: themeVars.fontSize.base,
      },
      sm: {
        height: '36px',
        fontSize: themeVars.fontSize.sm,
      },
      xs: {
        height: '24px',
        fontSize: themeVars.fontSize.xs,
        padding: `0 ${themeVars.spacing['2']}`,
      },
    },
  },
  defaultVariants: {
    variant: 'outline',
    theme: 'primary',
  },
});

export type ButtonVariants = RecipeVariants<typeof buttonVariant>;
