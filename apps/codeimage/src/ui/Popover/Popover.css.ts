import {style} from '@vanilla-extract/css';

export const content = style({
  outline: 'none',
  selectors: {
    '&[data-expanded]': {pointerEvents: 'auto'},
    '&[data-closed]': {pointerEvents: 'none'},
  },
});
