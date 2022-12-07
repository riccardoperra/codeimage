import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/core/responsive';
import {rootThemeVars} from '~/theme.css';

export const main = style([
  {
    backgroundColor: '#000',
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

export const halfCard = style([
  {
    border: `1px solid rgb(24 24 27)`,
    backgroundColor: 'rgb(39 39 42 / 0.25)',
    placeContent: 'center flex-start',
    alignItems: 'center',
    display: 'flex',
    flexFlow: 'row nowrap',
    gap: '96px',
    overflow: 'visible',
    position: 'relative',
    flexDirection: 'column',
    padding: '24px',
    borderRadius: '24px',
    flex: 1,
  },
  responsiveStyle({
    mobile: {
      borderRadius: '32px',
    },
    desktop: {
      flexDirection: 'row',
      borderRadius: '96px',
      padding: '48px',
      paddingTop: themeVars.spacing[24],
      paddingBottom: themeVars.spacing[24],
    },
  }),
]);

export const card = style([
  {
    border: `1px solid rgb(24 24 27)`,
    backgroundColor: 'rgb(39 39 42 / 0.25)',
    placeContent: 'center flex-start',
    alignItems: 'center',
    display: 'flex',
    flexFlow: 'row nowrap',
    gap: '96px',
    overflow: 'visible',
    position: 'relative',
    flexDirection: 'column-reverse',
    padding: '24px',
  },
  responsiveStyle({
    mobile: {
      borderRadius: '32px',
    },
    desktop: {
      flexDirection: 'row',
      borderRadius: '96px',
      padding: '48px',
    },
  }),
]);

export const content = style({
  placeContent: 'center',
  alignItems: 'center',
  display: 'flex',
  flexFlow: 'column nowrap',
  gap: '48px',
  overflow: 'hidden',
  padding: '0px',
  position: 'relative',
  textAlign: 'center',
  flex: 1,
});

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

export const imageSection = style([
  {
    flex: '0 0 auto',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: rootThemeVars.purple,
    borderRadius: '48px',
    opacity: 1,
    height: '300px',
    width: '100%',
  },
  responsiveStyle({
    desktop: {
      height: '484px',
      borderRadius: '64px',
      flex: 1,
    },
  }),
]);

export const imageWrapper = style({
  aspectRatio: '2 / 1',
  flex: '0 0 auto',
  borderRadius: '32px',
  height: '568px',
  left: '48px',
  overflow: 'visible',
  position: 'absolute',
  right: '-128px',
  top: '48px',
});

export const analyticsCardContainer = style({
  display: 'flex',
  gap: '24px',
});

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

export const analyticsCard = style({
  width: '224px',
  height: '140px',
  boxSizing: 'content-box',
  background: themeVars.backgroundColor.purple['200'],
  padding: '24px',
  borderRadius: '32px',
  color: themeVars.textColor.gray['800'],
});

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
