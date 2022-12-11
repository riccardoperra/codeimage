import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';

export const footer = style({
  backgroundColor: themeVars.dynamicColors.panel.background,
});

export const content = style({
  maxWidth: '80rem',
  margin: 'auto',
  paddingTop: themeVars.spacing[6],
  paddingBottom: themeVars.spacing[6],
});

export const grid = style([
  {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: themeVars.spacing[4],
  },
  responsiveStyle({
    mobile: {
      padding: `0 ${themeVars.spacing[6]}`,
    },
    desktop: {padding: 0},
  }),
]);

export const info = style([
  {
    lineHeight: 1.5,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: themeVars.spacing[2],
  },
]);

export const link = style({
  color: themeVars.dynamicColors.descriptionTextColor,

  ':visited': {
    color: themeVars.dynamicColors.descriptionTextColor,
  },
});
