import {createTheme, style} from '@vanilla-extract/css';

export const [scaffoldTheme, scaffoldVars] = createTheme({
  toolbarHeight: '52px',
  panelWidth: '280px',
  virtualHeightFallback: '1vh',
});

export const scaffold = style([
  scaffoldTheme,
  {
    height: '100%',
  },
]);
