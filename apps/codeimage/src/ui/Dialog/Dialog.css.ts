import {createTheme, style} from '@vanilla-extract/css';
import {themeVars, textStyles} from '@codeimage/ui';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import {adaptiveFullScreenHeight} from '../../theme/base.css';

export const [dialogTheme, dialogThemeVars] = createTheme({
  contentPadding: themeVars.spacing['6'],
});

export const host = style([
  dialogTheme,
  {
    position: 'fixed',
    inset: 0,
    zIndex: themeVars.zIndex['50'],
    overflowY: 'auto',
  },
]);

export const wrapper = style({
  minHeight: themeVars.minHeight.full,
  padding: `0 ${themeVars.spacing['4']}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  selectors: {
    '[data-full-screen=true] &': {
      padding: 0,
      margin: 0,
    },
  },
});

export const overlay = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: themeVars.dynamicColors.dialog.overlayBackgroundColor,
});

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
    margin: `${themeVars.margin['8']} 0`,
    overflow: 'hidden',
    textAlign: 'left',
    color: themeVars.dynamicColors.dialog.panelTextColor,
    alignItems: 'stretch',
    boxShadow: themeVars.dynamicColors.dialog.panelShadow,
    borderRadius: themeVars.borderRadius.lg,
    backgroundColor: themeVars.dynamicColors.dialog.panelBackgroundColor,
    transform: 'translate(0, 0)',
  },

  variants: {
    size: {
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
