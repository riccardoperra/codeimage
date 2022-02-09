import {createTheme, style} from '@vanilla-extract/css';

export const [scaffoldTheme, scaffoldVars] = createTheme({
  toolbarHeight: '60px',
  panelWidth: '260px',
});

export const scaffold = style([
  scaffoldTheme,
  {
    height: '100vh',
    width: '100vw',
  },
]);
