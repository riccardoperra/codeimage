import {createTheme, style} from '@vanilla-extract/css';

export const [scaffoldTheme, scaffoldVars] = createTheme({
  virtualHeightFallback: '1vh',
  toolbarHeight: '60px',
  panelWidth: '280px',
});

export const scaffold = style([
  scaffoldTheme,
  {
    height: '100vh',
    width: '100vw',
    position: 'relative',
    display: 'flex',

    '@media': {
      'screen and (max-width: 768px)': {
        height: `calc(${scaffoldVars.virtualHeightFallback} * 100)`,
        '@supports': {
          // ios 15+
          '(height: 100svh)': {
            height: '100svh',
          },
        },
        overflow: 'hidden',
        flexDirection: 'column',
      },
    },
  },
]);
