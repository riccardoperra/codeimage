import {style} from '@vanilla-extract/css';
import {recipe} from '@vanilla-extract/recipes';

export const container = style({
  opacity: 1,
  transition: 'opacity 150ms ease-in-out',
  display: 'flex',
  height: '100%',
});

export const icon = recipe({
  base: {
    width: '20px',
    height: '20px',
  },
});
