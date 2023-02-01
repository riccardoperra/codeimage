import {style} from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  position: 'relative',
});

export const progressBar = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '10px',
  backgroundColor: 'rgb(255, 255, 255, 1)',
  width: '100%',
  transform: 'scaleX(0)',
  transformOrigin: '0%',
});
