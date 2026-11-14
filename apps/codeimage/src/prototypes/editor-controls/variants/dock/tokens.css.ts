import {themeVars, withThemeMode} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

/**
 * Hands the project's tokens to `dock.css` as plain custom properties, so the
 * rest of the variant can be written as ordinary CSS under the `dock-` prefix.
 */
export const tokens = style({
  vars: {
    '--dock-canvas': themeVars.dynamicColors.background,
    '--dock-surface': themeVars.dynamicColors.panel.background,
    '--dock-raised': themeVars.dynamicColors.input.backgroundColor,
    '--dock-pressed': themeVars.dynamicColors.button.base.backgroundColor,
    '--dock-text': themeVars.dynamicColors.baseText,
    '--dock-muted': themeVars.dynamicColors.descriptionTextColor,
    '--dock-border': themeVars.dynamicColors.divider,
    '--dock-primary': themeVars.dynamicColors.primary,
    '--dock-on-primary': themeVars.dynamicColors.button.primary.textColor,
    '--dock-radius': themeVars.borderRadius.xl,
    '--dock-radius-sm': themeVars.borderRadius.lg,
  },
  selectors: {
    ...withThemeMode({
      dark: {
        vars: {
          '--dock-shadow':
            '0 12px 32px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.3)',
          '--dock-knob': themeVars.dynamicColors.baseText,
        },
      },
      light: {
        vars: {
          '--dock-shadow': themeVars.boxShadow.lg,
          '--dock-knob': themeVars.backgroundColor.white,
        },
      },
    }),
  },
});
