import {themeVars} from '@codeimage/ui';
import {keyframes, style} from '@vanilla-extract/css';
// import * as headerStyles from '../Header/Header.css';

export const main = style({
  display: 'flex',
  margin: 'auto',
  flexDirection: 'column',
  overflow: 'hidden',
  height: '100%',
  width: '100%',
  minHeight: '100%',
  background: 'linear-gradient(179deg, #090909 0%, #000000 95%)',
  position: 'relative',
});

export const content = style({
  width: '80%',
  margin: 'auto',
  // marginTop: headerStyles.toolbarVars.toolbarHeight,
  marginTop: '56px',

  paddingTop: themeVars.spacing[24],

  '@media': {
    [`(min-width: 1280px)`]: {
      width: '1280px',
    },
  },

  display: 'flex',
  alignItems: 'center',
  flex: 1,
});

export const imageBox = style({
  position: 'relative',
  display: 'flex',
  flex: '0 0 auto',
  margin: 'auto',
  width: '100%',
  marginTop: themeVars.spacing[24],
  borderRadius: '12px',
  overflow: 'hidden',
  background:
    'linear-gradient(to right top, #7f469d, #8242aa, #833db7, #8338c4, #8233d2, #8a35da, #9336e2, #9b38ea, #af41ee, #c24af2, #d554f7, #e65ffb)',
  '@media': {
    '(min-width: 920px)': {
      width: '1400px',
      borderRadius: '42px',
    },
  },
});

export const textBox = style({
  flex: 1,
  width: '100%',
  display: 'flex',
  alignItems: 'flex-start',
});

export const text = style({
  width: '100%',
  maxWidth: '860px',
  textAlign: 'left',
  fontSize: '44px',
  lineHeight: '100%',
  '@media': {
    '(min-width: 960px)': {
      fontSize: '96px',
    },
  },
});

export const bgAnimation = keyframes({
  '0%': {
    backgroundPosition: '0% 50%',
  },
  '50%': {
    backgroundPosition: '100% 50%',
  },
  '100%': {
    backgroundPosition: '0% 50%',
  },
});

export const backdropTransform = keyframes({
  '0%': {
    transform: 'translateY(80%)',
    opacity: 1,
  },
  '70%': {
    filter: 'blur(400px)',
  },
  '85%': {
    transform: 'translateY(0)',
  },
  '100%': {
    transform: 'translateY(0)',
    filter: 'blur(160px)',
    opacity: 0.5,
  },
});

export const imageLeft = style({
  zIndex: 1,
  overflow: 'hidden',
  width: '100%',
});

export const backdrop = style({
  filter: 'blur(160px)',
  transform: 'translateZ(0px)',
  opacity: '.5',
  background:
    'conic-gradient(from 230.29deg at 51.63% 52.16%, rgb(36, 0, 255) 0deg, rgb(0, 135, 255) 67.5deg, rgb(108, 39, 157) 198.75deg, rgb(24, 38, 163) 251.25deg, rgb(54, 103, 196) 301.88deg, rgb(105, 30, 255) 360deg)',
  overflow: 'hidden',
  backgroundSize: '400% 400%',
  width: '60%',
  height: '100%',
  position: 'absolute',
  zIndex: 0,
  margin: 'auto',
  animation: `${bgAnimation} 7s ease infinite, ${backdropTransform} 6s ease-in-out 1`,
  marginTop: '100px',
});

export const screenshot = style({
  color: themeVars.backgroundColor.blue[400],
});

export const giantButton = style({
  height: '64px',
  borderRadius: '16px',
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: themeVars.spacing['6'],
  paddingRight: themeVars.spacing['6'],
  fontWeight: themeVars.fontWeight.medium,
  fontSize: themeVars.fontSize.xl,
});
