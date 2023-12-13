import {style} from '@vanilla-extract/css';

export const inlineItem = style({
  visibility: 'hidden',
  display: 'inline-block',
  height: 0,
  position: 'absolute',
});

export const input = style({
  backgroundColor: 'transparent',
  color: 'inherit',
  appearance: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  border: 'none',
});
