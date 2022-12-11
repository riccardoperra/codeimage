import {backgroundColorVar, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';
import {rootThemeVars} from '~/theme/theme.css';

export const sectionWrapper = style([
  {
    backgroundColor: rootThemeVars.black,
    position: 'relative',
  },
  responsiveStyle({
    mobile: {
      paddingLeft: themeVars.spacing[4],
      paddingRight: themeVars.spacing[4],
      height: '200vh',
    },
    tablet: {
      height: '275vh',
    },
    desktop: {
      padding: 0,
    },
  }),
]);

export const backdrop = style({
  content: '',
  zIndex: -1,
  position: 'absolute',
  right: 0,
  bottom: 0,
  left: 0,
  transform: 'translate3d(0px, -50%, 0) scale(0.90)',
  filter: 'blur(500px) saturate(200%)',
  opacity: '0.7',
  transition: 'opacity 0.3s',
  borderRadius: '1.5rem',
  flex: 1,
  overflow: 'hidden',
  height: '500px',
  top: '50%',
  '@media': {
    '(min--moz-device-pixel-ratio:0)': {
      // Trying to simulate Chrome/Safari blurry effect with firefox
      transform: 'translate3d(0, 0, 0) scale(0.90)',
      height: '100%',
      top: 0,
      opacity: 0.3,
      filter: 'blur(200px)',
    },
  },
});

export const stickyContent = style([
  {
    position: 'sticky',
    width: `100%`,
    display: 'flex',
    alignItems: 'center',
    willChange: 'transform',
    flexDirection: 'column',
    zIndex: '1',
    left: '0px',
    gap: '24px',
    filter: 'saturate(1.2)',
    height: '100vh',
    maxWidth: '80rem',
    marginLeft: 'auto',
    marginRight: 'auto',
    '@supports': {
      '(height: 100svh)': {
        height: '100svh',
      },
    },
  },
  responsiveStyle({
    mobile: {
      top: '64px',
    },
    tablet: {
      top: '100px',
    },
  }),
]);
