import {tokens} from '@codeui/kit/tokens';
import {style} from '@vanilla-extract/css';

export const region = style({
  zIndex: 9999,
});

export const top = style([
  region,
  {
    top: tokens.space['16'],
  },
]);
