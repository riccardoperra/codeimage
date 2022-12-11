import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';
import {rootThemeVars} from '~/theme/theme.css';

export const main = style([
  {
    backgroundColor: rootThemeVars.black,
    paddingLeft: themeVars.spacing[6],
    paddingRight: themeVars.spacing[6],
    paddingBottom: themeVars.spacing[24],
  },
  responsiveStyle({
    desktop: {
      paddingLeft: themeVars.spacing[0],
      paddingRight: themeVars.spacing[0],
    },
  }),
]);

export const container = style({
  maxWidth: '80rem',
  margin: 'auto',
});

export const twoSections = style([
  {
    display: 'flex',
    gap: themeVars.spacing['8'],
    flexDirection: 'column',
  },
  responsiveStyle({
    desktop: {
      flexDirection: 'row',
    },
  }),
]);

export const badge = style({
  width: '64px',
  height: '64px',
  color: 'white',
  borderRadius: '24px',
});

export const metricsBadge = style([
  badge,
  {
    backgroundColor: rootThemeVars.purple,
  },
]);

export const themeBuilderBadge = style([
  badge,
  {
    backgroundColor: rootThemeVars.red,
  },
]);

export const embedsBadge = style([
  badge,
  {
    backgroundColor: rootThemeVars.teal,
  },
]);

export const storageBadge = style([
  badge,
  {
    backgroundColor: rootThemeVars.green,
  },
]);

export const analyticsFeatureCard = style(
  responsiveStyle({
    mobile: {
      flexDirection: 'column-reverse',
    },
    desktop: {
      flexDirection: 'row',
    },
  }),
);

export const analyticsCardContainer = style([
  {
    display: 'flex',
    gap: '24px',
  },
]);

export const leftCardAnalytics = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
});

export const rightCardAnalytics = style({
  marginTop: '64px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
});

export const analyticsCard = style([
  {
    width: '224px',
    height: '140px',
    boxSizing: 'content-box',
    background: themeVars.backgroundColor.purple['200'],
    padding: '24px',
    color: themeVars.textColor.gray['800'],
  },
  responsiveStyle({
    mobile: {
      borderRadius: `16px`,
    },
    desktop: {
      borderRadius: '32px',
    },
  }),
]);

export const image = style({
  pointerEvents: 'none',
  userSelect: 'none',
  display: 'block',
  width: '100%',
  height: '100%',
  borderRadius: 'inherit',
  objectPosition: 'center',
  objectFit: 'cover',
  imageRendering: 'auto',
});

export const comingSoonBadge = style({
  backgroundColor: darkGrayScale.gray3,
  color: themeVars.dynamicColors.descriptionTextColor,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: themeVars.borderRadius.md,
  border: `1px solid ${darkGrayScale.gray6}`,
  paddingLeft: themeVars.spacing[2],
  paddingRight: themeVars.spacing[2],
});
