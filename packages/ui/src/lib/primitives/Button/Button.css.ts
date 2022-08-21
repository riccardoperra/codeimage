import {createVar, style} from '@vanilla-extract/css';
import {backgroundColorVar, colorVar} from '../../theme/variables.css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import {themeVars} from '../../theme';

export const buttonHeight = createVar();

export const button = style([
  {
    position: 'relative',
    display: 'inline-flex',
    overflow: 'hidden',
    height: buttonHeight,
    padding: `0 ${themeVars.spacing['3']}`,
    borderRadius: themeVars.borderRadius.lg,
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
    textDecoration: 'none',

    ':disabled': {
      cursor: 'default',
      opacity: 0.5,
    },

    ':focus': {
      boxShadow: themeVars.boxShadow.outline,
    },
  },
]);

export const buttonIcon = style({
  marginRight: themeVars.spacing['2'],
});

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
    loading: {
      true: {
        opacity: 0.7,
        pointerEvents: 'none',
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
      primaryAlt: {
        vars: {
          [backgroundColorVar]:
            themeVars.dynamicColors.button.primaryAlt.backgroundColor,
          [colorVar]: themeVars.dynamicColors.button.primaryAlt.textColor,
        },
        selectors: {
          '&:not(:disabled):hover': {
            vars: {
              [backgroundColorVar]:
                themeVars.dynamicColors.button.primaryAlt.hoverColor,
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
      danger: {
        vars: {
          [backgroundColorVar]:
            themeVars.dynamicColors.button.danger.backgroundColor,
          [colorVar]: themeVars.dynamicColors.button.danger.textColor,
        },
        selectors: {
          '&:not(:disabled):hover': {
            vars: {
              [backgroundColorVar]:
                themeVars.dynamicColors.button.danger.hoverColor,
            },
          },
        },
      },
    },

    size: {
      md: {
        vars: {
          [buttonHeight]: '42px',
        },
        minWidth: '72px',
        fontSize: themeVars.fontSize.base,
      },
      sm: {
        vars: {
          [buttonHeight]: '36px',
        },
        fontSize: themeVars.fontSize.sm,
      },
      xs: {
        vars: {
          [buttonHeight]: '30px',
        },
        fontSize: themeVars.fontSize.xs,
        padding: `0 ${themeVars.spacing['2']}`,
      },
      xxs: {
        vars: {
          [buttonHeight]: '24px',
        },
        fontSize: themeVars.fontSize.xs,
        padding: `0 ${themeVars.spacing['2']}`,
      },
    },
  },
  defaultVariants: {
    variant: 'outline',
    theme: 'primary',
    size: 'md',
  },
});

export type ButtonVariants = RecipeVariants<typeof buttonVariant>;
