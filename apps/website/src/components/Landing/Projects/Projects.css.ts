import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/core/responsive';
import {rootThemeVars} from '~/theme.css';

export const main = style([
  {
    backgroundColor: '#000',
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
    flexDirection: 'column',
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
    willChange: 'transform',
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

export const imageWrapper = style({
  aspectRatio: '2 / 1',
  flex: '0 0 auto',
  borderRadius: '32px',
  height: '568px',
  left: '48px',
  overflow: 'hidden',
  position: 'absolute',
  right: '-128px',
  top: '48px',
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
