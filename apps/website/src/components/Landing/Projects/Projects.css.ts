import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';
import {rootThemeVars} from '~/theme/theme.css';

export const main = style([
  {
    backgroundColor: rootThemeVars.black,
    paddingTop: themeVars.spacing[8],
    paddingBottom: themeVars.spacing[8],
  },
  responsiveStyle({
    mobile: {
      paddingLeft: themeVars.spacing[6],
      paddingRight: themeVars.spacing[6],
    },
    desktop: {
      paddingTop: themeVars.spacing[0],
      paddingLeft: themeVars.spacing[0],
      paddingRight: themeVars.spacing[0],
    },
  }),
]);

export const container = style({
  maxWidth: '80rem',
  margin: 'auto',
});

export const storageBadge = style({
  backgroundColor: rootThemeVars.green,
  width: '64px',
  height: '64px',
  color: 'white',
  borderRadius: '24px',
});

export const imageSection = style([
  {
    flex: '0 0 auto',
    overflow: 'hidden',
    position: 'relative',
    background: rootThemeVars.green,
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

export const descriptionText = style({
  color: themeVars.dynamicColors.descriptionTextColor,
});
