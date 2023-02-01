import {style} from '@vanilla-extract/css';

export const loading = style({
  position: 'absolute',
  right: '1rem',
  top: '1rem',
});

export const preview = style({
  fontFamily: 'Jetbrains Mono, monospace',
  backgroundColor: 'unset',
  color: 'white',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  margin: 0,
});
