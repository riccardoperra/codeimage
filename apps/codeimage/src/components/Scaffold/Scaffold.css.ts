import {createTheme, style} from '@vanilla-extract/css';
import {adaptiveFullScreenHeight} from '../../theme/base.css';

export const [scaffoldTheme, scaffoldVars] = createTheme({
  toolbarHeight: '60px',
  panelWidth: '280px',
  virtualHeightFallback: '1vh',
});

export const scaffold = style([
  scaffoldTheme,
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
