import {createTheme, style} from '@vanilla-extract/css';
import {dynamicFullScreenHeight} from '../../theme/base.css';

export const [scaffoldTheme, scaffoldVars] = createTheme({
  toolbarHeight: '60px',
  panelWidth: '280px',
});

export const scaffold = style([
  scaffoldTheme,
  dynamicFullScreenHeight,
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
