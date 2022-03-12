import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';
import {fontSize, fontWeight} from '../Text/Text.css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';

export const [dialogTheme, dialogThemeVars] = createTheme({
  contentPadding: themeVars.spacing['6'],
});

export const host = style([
  dialogTheme,
  {
    position: 'fixed',
    inset: 0,
    zIndex: themeVars.zIndex['30'],
    overflowY: 'auto',
  },
]);

export const wrapper = style({
  minHeight: themeVars.minHeight.full,
  padding: `0 ${themeVars.spacing['4']}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const overlay = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: themeVars.dynamicColors.dialogOverlayBackgroundColor,
});

export const title = style([
  fontSize.lg,
  fontWeight.medium,
  {
    color: themeVars.dynamicColors.dialogTitleTextColor,
    height: '52px',
    borderBottom: `1px solid ${themeVars.dynamicColors.dialogTitleBorderColor}`,
    padding: `0 ${dialogThemeVars.contentPadding}`,
    display: 'flex',
    alignItems: 'center',
  },
]);

export const panelContent = style({
  padding: `${dialogThemeVars.contentPadding}`,
});

export const panelFooter = style({
  padding: `${dialogThemeVars.contentPadding}`,
});

// <DialogPanel class="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-50 dark:bg-gray-900 shadow-xl rounded-2xl dark:border dark:border-gray-50">
export const panel = recipe({
  base: {
    display: 'inline-block',
    width: themeVars.width.full,
    padding: 0,
    margin: `${themeVars.margin['8']} 0`,
    overflow: 'hidden',
    textAlign: 'left',
    color: themeVars.dynamicColors.dialogPanelTextColor,
    alignItems: 'center',
    boxShadow: themeVars.dynamicColors.dialogPanelShadow,
    borderRadius: themeVars.borderRadius.lg,
    backgroundColor: themeVars.dynamicColors.dialogPanelBackgroundColor,
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
  },
});

export type DialogPanelVariants = RecipeVariants<typeof panel>;
