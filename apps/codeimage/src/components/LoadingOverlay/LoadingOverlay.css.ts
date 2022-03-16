import {style} from '@vanilla-extract/css';

export const overlay = style({
  position: 'absolute',
  width: '100%',
  height: '100%',
  backgroundColor: `rgba(0, 0, 0, .25)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});
