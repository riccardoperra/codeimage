import {themeVars} from '@codeimage/ui';
import {keyframes, style} from '@vanilla-extract/css';
// import * as headerStyles from '../Header/Header.css';

export const main = style({
  display: 'flex',
  margin: 'auto',
  flexDirection: 'column',
  overflow: 'hidden',
  height: '80vh',
  width: '100%',
  background: '#090909',
  position: 'relative',
});

export const content = style({
  width: '100%',
  margin: 'auto',
  // marginTop: headerStyles.toolbarVars.toolbarHeight,
  marginTop: '56px',

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
  flex: 1,
  display: 'flex',
  margin: 'auto',
  width: '960px',
});

export const textBox = style({
  flex: 1,
});

export const text = style({
  width: '100%',
  textAlign: 'center',
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
  transform: 'translate(-50%, 0px)',
  position: 'absolute',
  width: '100%',
  left: '50%',
  zIndex: 1,
  borderRadius: themeVars.borderRadius.xl,
  boxShadow: themeVars.boxShadow['2xl'],
  overflow: 'hidden',
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
  position: 'relative',
  zIndex: 0,
  margin: 'auto',
  animation: `${bgAnimation} 7s ease infinite, ${backdropTransform} 6s ease-in-out 1`,
  marginTop: '100px',
});

export const screenshot = style({
  display: 'inline-block',
  position: 'relative',
  '::before': {
    content: '',
    width: '100%',
    height: 'px',
    bottom: 0,
    position: 'absolute',
    backgroundColor: themeVars.backgroundColor.blue[600],
  },
});
