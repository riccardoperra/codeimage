import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const footer = style({
  backgroundColor: themeVars.dynamicColors.panel.background,
});

export const content = style({
  maxWidth: '80rem',
  margin: 'auto',
  paddingTop: themeVars.spacing[6],
  paddingBottom: themeVars.spacing[6],
});

export const grid = style({
  display: 'flex',
  justifyContent: 'space-between',
});

export const link = style({
  color: themeVars.dynamicColors.descriptionTextColor,

  ':visited': {
    color: themeVars.dynamicColors.descriptionTextColor,
  },
});
