import {themeVars} from '@codeimage/ui';
import {createVar, keyframes, style} from '@vanilla-extract/css';

export const progressOpacityEditor = createVar();

const dotColor = createVar();

export const main = style({
  vars: {
    [dotColor]: '#dddddd50',
  },
  display: 'flex',
  margin: 'auto',
  flexDirection: 'column',
  overflow: 'hidden',
  height: '100%',
  width: '100%',
  minHeight: '100%',
  backgroundImage: `radial-gradient(${dotColor} 1.5px, transparent 1.5px),radial-gradient(${dotColor} 1.5px, transparent 1.5px)`,
  backgroundSize: 'calc(20 * 1.5px) calc(20 * 1.5px)',
  backgroundPosition: '0 0,calc(10 * 1.5px) calc(10 * 1.5px)',
  position: 'relative',

  '::before': {
    content: '""',
    background: 'linear-gradient(179deg, #09090900 0%, #000000 100%)',
    position: 'absolute',
    bottom: '0',
    height: '100%',
    width: '100%',
    zIndex: '0',
  },
});

export const content = style({
  width: '80%',
  margin: 'auto',
  marginTop: '56px',
  zIndex: 1,

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

export const bgAnimation = keyframes({
  '0%': {
    opacity: '0',
  },
  '50%': {
    opacity: '1',
  },
  '100%': {
    opacity: '0',
  },
});

export const imageBox = style({
  position: 'relative',
  display: 'flex',
  flex: '0 0 auto',
  margin: 'auto',
  width: '100%',
  marginTop: themeVars.spacing[8],
  borderRadius: '12px',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #FF0076 0%, #590FB7 100%)',
  transform: `rotateX(15deg) rotateY(-10deg)`,
  '@media': {
    '(min-width: 920px)': {
      width: '90%',
      maxWidth: '1280px',
      borderRadius: '42px',
    },
  },
  '::before': {
    position: 'absolute',
    content: '""',
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    backgroundImage:
      'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
    zIndex: '-1',
    opacity: progressOpacityEditor,
  },
});

export const imagePerspectiveBox = style({
  overflow: 'visible',
  position: 'relative',
  perspective: '1000px',
  paddingBottom: '200px',
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
      fontSize: '84px',
    },
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
  width: '100%',
  height: '100%',
  zIndex: 1,
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
  color: themeVars.backgroundColor.blue[500],
});

export const giantButton = style({
  '@media': {
    '(min-width: 960px)': {
      height: '64px',
      borderRadius: '16px',
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: themeVars.spacing['6'],
      paddingRight: themeVars.spacing['6'],
      fontWeight: themeVars.fontWeight.medium,
      fontSize: themeVars.fontSize.xl,
    },
  },
});
