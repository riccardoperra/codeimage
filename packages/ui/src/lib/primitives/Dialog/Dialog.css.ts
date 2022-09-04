import {createTheme, style} from '@vanilla-extract/css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import {adaptiveFullScreenHeight, themeVars} from '../../theme';
import * as textStyles from '../Text/Text.css';

export const [dialogTheme, dialogThemeVars] = createTheme({
  contentPadding: themeVars.spacing['6'],
  panelRadius: themeVars.borderRadius.lg,
});

export const host = style([
  dialogTheme,
  {
    position: 'fixed',
    zIndex: themeVars.zIndex['50'],
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
]);

export const wrapper = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: dialogThemeVars.panelRadius,
    ':focus-visible': {
      boxShadow: themeVars.boxShadow.outline,
      outline: 'none',
    },
  },
  variants: {
    fullScreen: {
      true: {
        padding: 0,
        margin: 0,
        minHeight: themeVars.minHeight.full,
        width: '100%',
        height: '100%',
        ':focus-visible': {
          boxShadow: 'none',
          outline: 'none',
        },
      },
    },
  },
});

export const overlay = style([
  host,
  {
    backgroundColor: themeVars.dynamicColors.dialog.overlayBackgroundColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
]);

export const title = style([
  textStyles.fontSize.lg,
  textStyles.fontWeight.medium,
  {
    color: themeVars.dynamicColors.dialog.titleTextColor,
    height: '52px',
    borderBottom: `1px solid ${themeVars.dynamicColors.dialog.titleBorderColor}`,
    padding: `0 ${dialogThemeVars.contentPadding}`,
    display: 'flex',
    alignItems: 'center',
    selectors: {
      '[data-full-screen=true] &': {
        backgroundColor: themeVars.dynamicColors.panel.background,
      },
    },
  },
]);

export const panelContent = style({
  padding: `${dialogThemeVars.contentPadding}`,
  selectors: {
    '[data-full-screen=true] &': {
      overflow: 'auto',
      flex: 1,
    },
  },
});

export const panelFooter = style({
  padding: `${dialogThemeVars.contentPadding}`,
  selectors: {
    '[data-full-screen=true] &': {
      marginTop: 'auto',
      marginBottom: 'env(safe-area-inset-bottom, 20px)',
    },
  },
});

export const panel = recipe({
  base: {
    display: 'inline-flex',
    flexDirection: 'column',
    width: themeVars.width.full,
    padding: 0,
    height: themeVars.minHeight.full,
    overflow: 'hidden',
    textAlign: 'left',
    color: themeVars.dynamicColors.dialog.panelTextColor,
    alignItems: 'stretch',
    boxShadow: themeVars.dynamicColors.dialog.panelShadow,
    borderRadius: dialogThemeVars.panelRadius,
    backgroundColor: themeVars.dynamicColors.dialog.panelBackgroundColor,
    transform: 'translate(0, 0)',
  },

  variants: {
    size: {
      xs: {
        '@media': {
          'screen and (min-width: 768px)': {
            width: '24rem',
          },
        },
      },
      sm: {
        '@media': {
          'screen and (min-width: 768px)': {
            width: '28rem',
          },
        },
      },
      md: {
        '@media': {
          'screen and (min-width: 768px)': {
            width: '32rem',
          },
        },
      },
      lg: {
        '@media': {
          'screen and (min-width: 768px)': {
            width: '48rem',
          },
        },
      },
      xl: {
        '@media': {
          'screen and (min-width: 768px)': {
            width: '64rem',
          },
        },
      },
    },
    fullScreen: {
      true: [adaptiveFullScreenHeight, {margin: 0, borderRadius: 0}],
    },
  },
});

export type DialogPanelVariants = RecipeVariants<typeof panel>;
