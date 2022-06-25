import {adaptiveFullScreenHeight} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const wrapper = style([
  adaptiveFullScreenHeight,
  {
    width: '100vw',
    position: 'relative',
    display: 'flex',

    '@media': {
      'screen and (max-width: 768px)': {
        flexDirection: 'column',
      },
    },
  },
]);
