import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';

export const main = style({
  backgroundColor: darkGrayScale.gray2,
  overflow: 'hidden',
});

export const githubLogo = style({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  zIndex: 10,
});

export const contributorsContent = style({
  maxWidth: '80rem',
  margin: 'auto',
});

export const contributorsStickyContent = style(
  responsiveStyle({
    mobile: {
      width: '100%',
      paddingTop: themeVars.spacing[12],
      paddingBottom: themeVars.spacing[12],
      paddingLeft: themeVars.spacing[6],
      paddingRight: themeVars.spacing[6],
    },
    desktop: {
      paddingLeft: themeVars.spacing[6],
      paddingRight: themeVars.spacing[6],
      paddingTop: themeVars.spacing[24],
      paddingBottom: themeVars.spacing[24],
    },
  }),
);

export const heading = style(
  responsiveStyle({
    mobile: {
      fontSize: themeVars.fontSize['4xl'],
      textAlign: 'center',
      marginBottom: 0,
    },
    desktop: {
      fontSize: themeVars.fontSize['6xl'],
    },
  }),
);

export const description = style(
  responsiveStyle({
    mobile: {
      fontSize: themeVars.fontSize['2xl'],
      margin: 0,
      marginBottom: themeVars.spacing[8],
    },
    desktop: {
      fontSize: themeVars.fontSize['3xl'],
      padding: themeVars.spacing[4],
      paddingLeft: 0,
    },
  }),
);

export const contributorsObject = style({
  visibility: 'hidden',
  selectors: {
    '&[data-visible=true]': {
      visibility: 'visible',
    },
  },
});
