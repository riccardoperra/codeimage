import {style} from '@vanilla-extract/css';
import {
  backgroundColorVar,
  textStyles,
  themeVars,
  withThemeMode,
} from '@codeimage/ui';

export const list = style({
  display: 'grid',
  gridGap: '0 60px',
  gridTemplateColumns: 'auto 1fr',
  gridAutoRows: '40px',
  margin: 0,
  alignItems: 'center',
  color: 'white',
  padding: `${themeVars.spacing['6']} ${themeVars.spacing['6']}`,
});

export const overlay = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: themeVars.dynamicColors.dialog.overlayBackgroundColor,
});

export const keyLabel = style([
  textStyles.fontSize.sm,
  {
    color: themeVars.dynamicColors.button.base.textColor,
  },
]);

export const keyList = style({
  display: 'flex',
  columnGap: themeVars.spacing['1'],
  justifyContent: 'flex-end',
});

export const key = style([
  textStyles.fontSize.sm,
  {
    minWidth: '24px',
    height: '24px',
    padding: '4px 8px',
    borderRadius: themeVars.borderRadius.md,
    backgroundColor: backgroundColorVar,
    color: themeVars.dynamicColors.button.base.textColor,
    fontFamily: 'inherit',
    selectors: {
      ...withThemeMode({
        light: {
          vars: {
            [backgroundColorVar]: '#f3f3f3',
          },
        },
        dark: {
          vars: {
            [backgroundColorVar]: '#555555',
          },
        },
      }),
    },
  },
]);
