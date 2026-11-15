import {globalStyle, style} from '@vanilla-extract/css';

export const placeholder = style({
  display: 'flex',
  boxSizing: 'border-box',
});

// The production skeleton is 600px wide with its own padding. Here it takes
// the size of the frame it stands in for.
globalStyle(`${placeholder} > *`, {
  width: '100%',
  height: '100%',
});
