import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

export const main = style({
  display: 'flex',
  margin: 'auto',
  flexDirection: 'column',
  overflow: 'hidden',
  height: '100vh',
  width: '100%',
  background: '#090909',
});

export const imageBox = style({
  position: 'relative',
  flex: 1,
});

export const textBox = style({
  flex: 1,
});

export const text = style({
  width: '50%',
  textAlign: 'center',
});

export const imageLeft = style({
  transform: 'translate(-50%, 0px)',
  position: 'absolute',
  width: '75%',
  left: '50%',
  zIndex: 1,
});

export const backdrop = style({
  filter: 'blur(160px)',
  transform: 'translateZ(0px)',
  opacity: '.5',
  background:
    'conic-gradient(from 230.29deg at 51.63% 52.16%, rgb(36, 0, 255) 0deg, rgb(0, 135, 255) 67.5deg, rgb(108, 39, 157) 198.75deg, rgb(24, 38, 163) 251.25deg, rgb(54, 103, 196) 301.88deg, rgb(105, 30, 255) 360deg)',
  overflow: 'hidden',
  width: '75%',
  height: '100%',
  position: 'relative',
  zIndex: 0,
  margin: 'auto',
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
