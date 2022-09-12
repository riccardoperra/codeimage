import {style} from '@vanilla-extract/css';
import {dynamicFullHeight} from './variables.css';

export const adaptiveFullScreenHeight = style({
  height: '100vh',
  '@media': {
    'screen and (max-width: 768px)': {
      height: `calc(${dynamicFullHeight} * 100)`,

      '@supports': {
        // ios 15+
        '(height: 100dvh)': {
          height: '100dvh',
        },
      },

      overflow: 'hidden',
    },
  },
});
