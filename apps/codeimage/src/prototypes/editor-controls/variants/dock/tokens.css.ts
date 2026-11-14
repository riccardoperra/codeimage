import {themeVars, withThemeMode} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

/**
 * Hands the project's tokens to `dock.css` as plain custom properties, so the
 * rest of the variant can be written as ordinary CSS under the `dock-` prefix.
 */
export const tokens = style({
  vars: {
    '--dock-app': themeVars.dynamicColors.panel.background,
    // Same surface as today's canvas, so every island reads as one family.
    '--dock-island': themeVars.dynamicColors.background,
    // What floats over the canvas takes the surface and shadow of the kit's dialogs.
    '--dock-float': themeVars.dynamicColors.dialog.panelBackgroundColor,
    '--dock-float-shadow': themeVars.dynamicColors.dialog.panelShadow,
    '--dock-raised': themeVars.dynamicColors.input.backgroundColor,
    '--dock-pressed': themeVars.dynamicColors.button.base.backgroundColor,
    '--dock-text': themeVars.dynamicColors.baseText,
    '--dock-muted': themeVars.dynamicColors.descriptionTextColor,
    '--dock-primary': themeVars.dynamicColors.primary,
    '--dock-text-xs': themeVars.fontSize.xs,
    '--dock-text-sm': themeVars.fontSize.sm,
  },
  selectors: {
    ...withThemeMode({
      dark: {vars: {'--dock-knob': themeVars.dynamicColors.baseText}},
      light: {vars: {'--dock-knob': themeVars.backgroundColor.white}},
    }),
  },
});
