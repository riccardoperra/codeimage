import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

export const main = style({
  backgroundColor: '#000',
  paddingTop: themeVars.spacing[64],
  paddingBottom: themeVars.spacing[24],
});

export const container = style({
  maxWidth: '80rem',
  margin: 'auto',
});

export const card = style({
  background: darkGrayScale.gray1,
  borderRadius: '96px',
  placeContent: 'center flex-start',
  alignItems: 'center',
  display: 'flex',
  flexFlow: 'row nowrap',
  gap: '96px',
  height: 'min-content',
  overflow: 'visible',
  padding: '48px',
  position: 'relative',
  width: '1312px',
});

export const content = style({
  placeContent: 'center',
  alignItems: 'center',
  display: 'flex',
  flex: '1 0 0px',
  flexFlow: 'column nowrap',
  gap: '48px',
  height: 'min-content',
  overflow: 'hidden',
  padding: '0px',
  position: 'relative',
  width: '1px',
  textAlign: 'center',
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
  height: '484px',
  overflow: 'hidden',
  position: 'relative',
  width: '704px',
  willChange: 'transform',
  background: themeVars.backgroundColor.green['500'],
  borderRadius: '64px',
  opacity: 1,
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
