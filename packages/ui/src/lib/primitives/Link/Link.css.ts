import {recipe} from '@vanilla-extract/recipes';

export const link = recipe({
  base: {
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
  },
  variants: {
    underline: {
      true: {
        textDecoration: 'underline',
      },
    },
  },
});
