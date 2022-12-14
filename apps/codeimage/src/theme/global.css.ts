import {globalStyle} from '@vanilla-extract/css';

globalStyle('body', {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  '@supports': {
    '(font-variation-settings: normal)': {
      // Inter var
      fontFamily: 'Inter var, system-ui, -apple-system, sans-serif',
      fontFeatureSettings: '"cv02","cv03","cv04","cv11"',
    },
  },
});
