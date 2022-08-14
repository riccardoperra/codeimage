import {style} from '@vanilla-extract/css';

export const button = style({
  backgroundColor: 'rgb(47, 51, 55)',
  color: 'rgb(255, 255, 255)',
  border: '1px solid rgb(47, 51, 55)',
  cursor: 'pointer',

  ':hover': {
    background: 'rgb(29,33,35)',
  },
});
