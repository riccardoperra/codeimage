import {style} from '@vanilla-extract/css';

export const overlay = style({
  position: 'fixed',
  width: '100%',
  left: 0,
  top: 0,
  height: '100%',
  backgroundColor: `rgba(0, 0, 0, .25)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});
