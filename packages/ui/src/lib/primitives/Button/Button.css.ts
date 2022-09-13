import {createVar, fallbackVar, style} from '@vanilla-extract/css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import {themeVars} from '../../theme';
import * as variables from '../../theme/variables.css';

export const buttonHeight = createVar();

export const enum ButtonSizes {
  xxs = 'xxs',
  xs = 'xs',
  sm = 'sm',
  md = 'md',
  lg = 'lg',
}

export const button = style({
  position: 'relative',
  display: 'inline-flex',
  overflow: 'hidden',
  height: buttonHeight,
  padding: `0 ${themeVars.spacing['3']}`,
  borderRadius: themeVars.borderRadius.lg,
  fontSize: variables.fontSize,
  fontWeight: themeVars.fontWeight.medium,
  lineHeight: 1,
  fontFamily: 'inherit',
  outline: 'none',
  placeContent: 'center',
  placeItems: 'center',
  transition: 'opacity .2s, background-color .2s, box-shadow .2s',
  backgroundColor: variables.backgroundColorVar,
  color: fallbackVar(variables.colorVar, themeVars.dynamicColors.baseText),
  userSelect: 'none',
  textDecoration: 'none',

  vars: {
    [variables.fontSize]: themeVars.fontSize.sm,
  },

  ':disabled': {
    cursor: 'default',
    opacity: 0.5,
  },

  ':focus': {
    boxShadow: themeVars.boxShadow.outline,
  },
});

export const buttonIcon = style({
  marginRight: themeVars.spacing['2'],
  width: `calc(${variables.fontSize} + 0.25rem)`,
  height: `calc(${variables.fontSize} + 0.25rem)`,
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
        backgroundColor: variables.backgroundColorVar,
        border: 'none',
      },
      outline: {
        backgroundColor: 'transparent',
        color: variables.backgroundColorVar,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'currentColor',

        ':hover': {
          backgroundColor: variables.backgroundColorVar,
          color: variables.colorVar,
          borderColor: variables.backgroundColorVar,
        },
      },
      link: {
        border: 'none',
        backgroundColor: 'transparent',
        color: variables.colorVar,

        selectors: {
          '&:not(:disabled):hover': {
            background: variables.backgroundColorVar,
          },
        },
      },
    },
    // Button theme
    theme: {
      primary: {
        vars: {
          [variables.backgroundColorVar]:
            themeVars.dynamicColors.button.primary.backgroundColor,
          [variables.colorVar]:
            themeVars.dynamicColors.button.primary.textColor,
        },
        selectors: {
          '&:not(:disabled):hover': {
            vars: {
              [variables.backgroundColorVar]:
                themeVars.dynamicColors.button.primary.hoverColor,
            },
          },
        },
      },
      primaryAlt: {
        vars: {
          [variables.backgroundColorVar]:
            themeVars.dynamicColors.button.primaryAlt.backgroundColor,
          [variables.colorVar]:
            themeVars.dynamicColors.button.primaryAlt.textColor,
        },
        selectors: {
          '&:not(:disabled):hover': {
            vars: {
              [variables.backgroundColorVar]:
                themeVars.dynamicColors.button.primaryAlt.hoverColor,
            },
          },
        },
      },
      secondary: {
        vars: {
          [variables.backgroundColorVar]:
            themeVars.dynamicColors.button.base.backgroundColor,
          [variables.colorVar]: themeVars.dynamicColors.button.base.textColor,
        },
        selectors: {
          '&:hover:not(:disabled)': {
            vars: {
              [variables.backgroundColorVar]:
                themeVars.dynamicColors.button.base.hoverColor,
            },
          },
        },
      },
      danger: {
        vars: {
          [variables.backgroundColorVar]:
            themeVars.dynamicColors.button.danger.backgroundColor,
          [variables.colorVar]: themeVars.dynamicColors.button.danger.textColor,
        },
        selectors: {
          '&:not(:disabled):hover': {
            vars: {
              [variables.backgroundColorVar]:
                themeVars.dynamicColors.button.danger.hoverColor,
            },
          },
        },
      },
    },

    size: {
      [ButtonSizes.lg]: {
        vars: {
          [buttonHeight]: '48px',
          [variables.fontSize]: themeVars.fontSize.lg,
        },
        minWidth: '72px',
      },
      [ButtonSizes.md]: {
        vars: {
          [buttonHeight]: '42px',
          [variables.fontSize]: themeVars.fontSize.base,
        },
      },
      [ButtonSizes.sm]: {
        vars: {
          [buttonHeight]: '36px',
          [variables.fontSize]: themeVars.fontSize.sm,
        },
      },
      [ButtonSizes.xs]: {
        vars: {
          [buttonHeight]: '30px',
          [variables.fontSize]: themeVars.fontSize.xs,
        },
        padding: `0 ${themeVars.spacing['2']}`,
      },
      [ButtonSizes.xxs]: {
        vars: {
          [buttonHeight]: '24px',
          [variables.fontSize]: themeVars.fontSize.xs,
        },
        padding: `0 ${themeVars.spacing['2']}`,
      },
    },
  },
  defaultVariants: {
    variant: 'solid',
    theme: 'primary',
    size: 'md',
  },
});

export type ButtonVariants = RecipeVariants<typeof buttonVariant>;
