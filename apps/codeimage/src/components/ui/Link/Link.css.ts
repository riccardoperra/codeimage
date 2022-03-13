import {style} from '@vanilla-extract/css';

export const link = style({
  textDecoration: 'none',

  ':link': {
    color: 'unset',
  },

  ':visited': {
    color: 'unset',
  },

  ':active': {
    color: 'unset',
  },
});
