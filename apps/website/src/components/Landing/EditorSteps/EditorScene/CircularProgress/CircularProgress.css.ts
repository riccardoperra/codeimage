import {style} from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  justifyContent: 'center',
});

export const progressText = style({
  color: '#fff',
  fontWeight: 'bold',
});

export const circle = style({
  strokeDashoffset: 0,
  strokeWidth: '10%',
  fill: 'none',
});

export const circularProgress = style({
  position: 'absolute',
  left: 0,
  top: 0,
});

export const bg = style({
  stroke: 'rgba(255, 255, 255, 1)',
});

export const progress = style({
  strokeDasharray: '0, 1',
});
