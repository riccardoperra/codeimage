import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const main = style({
  display: 'flex',
  margin: 'auto',
  overflow: 'hidden',
  height: '100vh',
});

export const imageBox = style({
  position: 'relative',
  flex: 1,
});

export const textBox = style({
  flex: 1,
});

export const text = style({
  width: '70%',
});

export const image = style({
  transform: 'translate(0px, 100px)',
  position: 'absolute',
});
