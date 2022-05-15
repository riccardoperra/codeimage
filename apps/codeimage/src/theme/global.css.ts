import {globalStyle} from '@vanilla-extract/css';

globalStyle('body', {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  '@supports': {
    '(font-variation-settings: normal)': {
      // Inter var
      fontFamily: 'Inter,  system-ui, -apple-system, sans-serif',
    },
  },
  margin: 0,
  height: '100%',
  touchAction: 'none',
  position: 'relative',
  overscrollBehaviorY: 'none',
  fontSmooth: 'antialiased',
});

globalStyle('*', {
  boxSizing: 'border-box',
});

globalStyle('html, body', {
  overflow: 'hidden',
});
