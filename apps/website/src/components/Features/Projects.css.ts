import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

export const main = style({
  backgroundColor: '#000',
  paddingTop: themeVars.spacing[64],
  paddingBottom: themeVars.spacing[24],
  paddingLeft: themeVars.spacing[2],
  paddingRight: themeVars.spacing[2],

  '@media': {
    '(min-width: 748px)': {
      paddingLeft: themeVars.spacing[0],
      paddingRight: themeVars.spacing[0],
    },
  },
});

export const container = style({
  maxWidth: '80rem',
  margin: 'auto',
});

export const card = style({
  background: darkGrayScale.gray1,
  placeContent: 'center flex-start',
  alignItems: 'center',
  display: 'flex',
  flexFlow: 'row nowrap',
  gap: '96px',
  overflow: 'visible',
  position: 'relative',
  flexDirection: 'column',
  padding: '24px',
  borderRadius: '48px',

  '@media': {
    '(min-width: 748px)': {
      flexDirection: 'row',
      borderRadius: '96px',
      padding: '48px',
    },
  },
});

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

  // '(min-width: 748px)': {
  //   flexDirection: 'column',
  // },
});

export const storageBadge = style({
  backgroundColor: themeVars.backgroundColor.green['500'],
  width: '64px',
  height: '64px',
  color: 'white',
  borderRadius: '24px',
});

export const imageSection = style({
  flex: '0 0 auto',
  overflow: 'hidden',
  position: 'relative',
  willChange: 'transform',
  background: themeVars.backgroundColor.green['500'],
  borderRadius: '48px',
  opacity: 1,
  height: '300px',
  width: '100%',

  '@media': {
    '(min-width: 768px)': {
      height: '484px',
      borderRadius: '64px',
      flex: 1,
    },
  },
});

export const imageWrapper = style({
  aspectRatio: '2 / 1',
  flex: '0 0 auto',
  borderRadius: '32px',
  height: 'var(--framer-aspect-ratio-supported, 568px)',
  left: '48px',
  overflow: 'visible',
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
