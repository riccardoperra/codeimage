import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';

export const main = style({
  backgroundColor: darkGrayScale.gray2,
  overflow: 'hidden',
});

export const contributorsContent = style({
  maxWidth: '80rem',
  margin: 'auto',
});

export const contributorsStickyContent = style(
  responsiveStyle({
    mobile: {
      width: '100%',
      padding: `${themeVars.spacing[12]} ${themeVars.spacing[6]}`,
      display: 'flex',
      flexDirection: 'column',
      gap: themeVars.spacing[6],
    },
    desktop: {
      paddingLeft: themeVars.spacing[0],
      paddingRight: themeVars.spacing[0],
      paddingTop: themeVars.spacing[24],
      paddingBottom: themeVars.spacing[24],
      gap: themeVars.spacing[6],
    },
  }),
);

export const heading = style(
  responsiveStyle({
    mobile: {
      fontSize: themeVars.fontSize['3xl'],
      textAlign: 'center',
      marginBottom: 0,
    },
    desktop: {
      fontSize: themeVars.fontSize['5xl'],
    },
  }),
);

export const description = style(
  responsiveStyle({
    mobile: {
      fontSize: themeVars.fontSize['1xl'],
      margin: 0,
      lineHeight: 1.5,
    },
    desktop: {
      fontSize: themeVars.fontSize['2xl'],
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

export const becomeContributorLink = style([
  {fontSize: themeVars.fontSize['lg']},
  responsiveStyle({
    mobile: {
      fontSize: themeVars.fontSize['1xl'],
    },
    desktop: {
      fontSize: themeVars.fontSize['2xl'],
    },
  }),
]);
